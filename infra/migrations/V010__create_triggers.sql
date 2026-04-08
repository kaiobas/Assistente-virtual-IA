-- V010__create_triggers.sql
-- Triggers de auditoria, notificações e updated_at

-- ─────────────────────────────────────────────
-- 1. updated_at automático em todas as tabelas
-- ─────────────────────────────────────────────
create trigger trg_business_updated_at
  before update on business
  for each row execute function set_updated_at();

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

create trigger trg_professionals_updated_at
  before update on professionals
  for each row execute function set_updated_at();

create trigger trg_services_updated_at
  before update on services
  for each row execute function set_updated_at();

create trigger trg_appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();


-- ─────────────────────────────────────────────
-- 2. Auditoria de status de appointments
--    Toda mudança de status → registro em appointment_status_history
-- ─────────────────────────────────────────────
create or replace function log_appointment_status_change()
returns trigger language plpgsql as $$
begin
  -- Na criação registra o status inicial
  if TG_OP = 'INSERT' then
    insert into appointment_status_history (appointment_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, 'system');
    return new;
  end if;

  -- No update, só loga se o status mudou
  if TG_OP = 'UPDATE' and new.status <> old.status then
    insert into appointment_status_history (appointment_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, 'system');
  end if;

  return new;
end;
$$;

create trigger trg_appointment_status_history
  after insert or update on appointments
  for each row execute function log_appointment_status_change();


-- ─────────────────────────────────────────────
-- 3. Gera fila de notificações ao confirmar agendamento
--    Ao criar appointment com status 'pending':
--      → booking_created imediato
--    Ao mudar para 'confirmed':
--      → reminder_d1 (D-1 às 09:00)
--      → reminder_h2 (H-2)
--      → confirmation_request (H-4, expira em H-2)
-- ─────────────────────────────────────────────
create or replace function queue_appointment_notifications()
returns trigger language plpgsql as $$
declare
  v_tz text;
begin
  select b.timezone into v_tz
    from appointments a
    join business b on b.id = a.business_id
   where a.id = new.id;

  -- Agendamento criado → confirma recebimento
  if TG_OP = 'INSERT' then
    insert into notification_queue (appointment_id, client_id, type, send_at)
    values (new.id, new.client_id, 'booking_created', now());
    return new;
  end if;

  -- Status mudou para confirmed → agenda lembretes
  if TG_OP = 'UPDATE' and new.status = 'confirmed' and old.status <> 'confirmed' then
    -- Lembrete D-1 às 09:00 do dia anterior
    insert into notification_queue (appointment_id, client_id, type, send_at)
    values (
      new.id, new.client_id, 'reminder_d1',
      (date_trunc('day', new.scheduled_at at time zone v_tz) - interval '1 day'
        + interval '9 hours') at time zone v_tz
    );

    -- Pedido de confirmação H-4 (expira em H-2)
    insert into notification_queue (appointment_id, client_id, type, send_at, expires_at)
    values (
      new.id, new.client_id, 'confirmation_request',
      new.scheduled_at - interval '4 hours',
      new.scheduled_at - interval '2 hours'
    );

    -- Lembrete H-2
    insert into notification_queue (appointment_id, client_id, type, send_at)
    values (
      new.id, new.client_id, 'reminder_h2',
      new.scheduled_at - interval '2 hours'
    );
  end if;

  -- Cancelamento → avisa o cliente
  if TG_OP = 'UPDATE'
     and new.status in ('cancelled_by_business', 'cancelled_auto')
     and old.status not in ('cancelled_by_business', 'cancelled_auto', 'cancelled_by_client')
  then
    insert into notification_queue (appointment_id, client_id, type, send_at)
    values (new.id, new.client_id, 'cancellation_notice', now());

    -- Cancela notificações pendentes deste agendamento
    update notification_queue
       set status = 'cancelled'
     where appointment_id = new.id
       and status = 'pending'
       and type != 'cancellation_notice';
  end if;

  return new;
end;
$$;

create trigger trg_appointment_notifications
  after insert or update on appointments
  for each row execute function queue_appointment_notifications();


-- ─────────────────────────────────────────────
-- 4. Atualiza last_contact_at do cliente ao receber mensagem
-- ─────────────────────────────────────────────
create or replace function update_client_last_contact()
returns trigger language plpgsql as $$
begin
  update clients
     set last_contact_at = now()
   where id = (
     select client_id from conversation_sessions
      where id = new.session_id
   );
  return new;
end;
$$;

create trigger trg_update_client_last_contact
  after insert on conversation_messages
  for each row execute function update_client_last_contact();
