-- V013__fix_rls_authenticated.sql
-- Adiciona policies para o role `authenticated` (usuários do dashboard)
-- e marca as funções de trigger como SECURITY DEFINER para que possam
-- escrever em notification_queue e appointment_status_history sem violar RLS.

-- ─────────────────────────────────────────────────────────────
-- 1. Políticas para authenticated em todas as tabelas do dashboard
-- Single-tenant: qualquer usuário autenticado tem acesso total.
-- Para multi-tenant, substituir `using (true)` por um filtro de tenant_id.
-- ─────────────────────────────────────────────────────────────

create policy "authenticated_all" on business
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on clients
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on professionals
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on services
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on professional_services
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on availability_rules
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on availability_exceptions
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on appointments
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on appointment_status_history
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on conversation_sessions
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on conversation_messages
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on notification_queue
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on notification_log
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- 2. SECURITY DEFINER nas funções de trigger
-- Faz com que os triggers rodem como o dono da função (postgres/superuser)
-- e não como o usuário que disparou a operação, contornando o RLS
-- nas tabelas internas (notification_queue, appointment_status_history).
-- ─────────────────────────────────────────────────────────────

create or replace function log_appointment_status_change()
returns trigger language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into appointment_status_history (appointment_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, 'system');
    return new;
  end if;

  if TG_OP = 'UPDATE' and new.status <> old.status then
    insert into appointment_status_history (appointment_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, 'system');
  end if;

  return new;
end;
$$;

create or replace function queue_appointment_notifications()
returns trigger language plpgsql
security definer
set search_path = public
as $$
declare
  v_tz text;
begin
  select b.timezone into v_tz
    from appointments a
    join business b on b.id = a.business_id
   where a.id = new.id;

  if TG_OP = 'INSERT' then
    insert into notification_queue (appointment_id, client_id, type, send_at)
    values (new.id, new.client_id, 'booking_created', now());
    return new;
  end if;

  if TG_OP = 'UPDATE' and new.status = 'confirmed' and old.status <> 'confirmed' then
    insert into notification_queue (appointment_id, client_id, type, send_at)
    values (
      new.id, new.client_id, 'reminder_d1',
      (date_trunc('day', new.scheduled_at at time zone v_tz) - interval '1 day'
        + interval '9 hours') at time zone v_tz
    );

    insert into notification_queue (appointment_id, client_id, type, send_at, expires_at)
    values (
      new.id, new.client_id, 'confirmation_request',
      new.scheduled_at - interval '4 hours',
      new.scheduled_at - interval '2 hours'
    );

    insert into notification_queue (appointment_id, client_id, type, send_at)
    values (
      new.id, new.client_id, 'reminder_h2',
      new.scheduled_at - interval '2 hours'
    );
  end if;

  if TG_OP = 'UPDATE'
     and new.status in ('cancelled_by_business', 'cancelled_auto')
     and old.status not in ('cancelled_by_business', 'cancelled_auto', 'cancelled_by_client')
  then
    insert into notification_queue (appointment_id, client_id, type, send_at)
    values (new.id, new.client_id, 'cancellation_notice', now());

    update notification_queue
       set status = 'cancelled'
     where appointment_id = new.id
       and status = 'pending'
       and type != 'cancellation_notice';
  end if;

  return new;
end;
$$;

create or replace function update_client_last_contact()
returns trigger language plpgsql
security definer
set search_path = public
as $$
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
