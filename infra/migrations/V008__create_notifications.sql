-- V008__create_notifications.sql
-- Fila de notificações e log de envios

create type notification_type as enum (
  'reminder_d1',           -- lembrete D-1
  'reminder_h2',           -- lembrete H-2
  'confirmation_request',  -- pedido de confirmação de presença
  'cancellation_notice',   -- aviso de cancelamento
  'booking_confirmed',     -- confirmação do agendamento criado
  'booking_created'        -- recibo imediato após agendamento
);

create type notification_status  as enum ('pending', 'sent', 'failed', 'cancelled');
create type notification_channel as enum ('whatsapp', 'sms', 'email');
create type delivery_status      as enum ('delivered', 'read', 'failed', 'unknown');

create table notification_queue (
  id             uuid                primary key default gen_random_uuid(),
  appointment_id uuid                not null references appointments(id) on delete cascade,
  client_id      uuid                not null references clients(id) on delete cascade,
  type           notification_type   not null,
  send_at        timestamptz         not null,   -- quando o schedule deve disparar
  status         notification_status not null default 'pending',
  expires_at     timestamptz,                    -- se pending depois daqui → marcar no_show
  attempts       integer             not null default 0,
  created_at     timestamptz         not null default now()
);

comment on column notification_queue.send_at    is 'Schedule do n8n filtra: status=pending AND send_at <= now()';
comment on column notification_queue.expires_at is 'Após expirar sem resposta, appointment vira no_show';
comment on column notification_queue.attempts   is 'Contador de tentativas de envio para retry logic';

create table notification_log (
  id              uuid              primary key default gen_random_uuid(),
  queue_id        uuid              not null references notification_queue(id),
  appointment_id  uuid              not null references appointments(id),
  channel         notification_channel not null default 'whatsapp',
  message_body    text              not null,   -- mensagem exata enviada
  sent_at         timestamptz       not null default now(),
  delivery_status delivery_status               default 'unknown',
  error_message   text                          -- detalhe do erro se falhou
);

comment on table notification_log is 'Registro imutável de tudo que foi enviado — não limpar mesmo após envio';
