-- V006__create_appointments.sql
-- Agendamentos e auditoria de status

create type appointment_status as enum (
  'pending',              -- criado pela IA, aguardando confirmação do cliente
  'confirmed',            -- cliente confirmou
  'cancelled_by_client',  -- cliente cancelou
  'cancelled_by_business',-- dono cancelou
  'cancelled_auto',       -- cancelamento automático por não resposta
  'completed',            -- atendimento realizado
  'no_show'               -- cliente não apareceu
);

create type appointment_source as enum ('whatsapp', 'dashboard', 'manual');

create table appointments (
  id              uuid                primary key default gen_random_uuid(),
  tenant_id       uuid                            default null,
  business_id     uuid                not null references business(id) on delete cascade,
  client_id       uuid                not null references clients(id),
  professional_id uuid                not null references professionals(id),
  service_id      uuid                not null references services(id),
  scheduled_at    timestamptz         not null,
  ends_at         timestamptz         not null,   -- desnormalizado: scheduled_at + duration_min
  status          appointment_status  not null default 'pending',
  source          appointment_source  not null default 'whatsapp',
  notes           text,                           -- observações do agendamento
  cancelled_reason text,
  created_at      timestamptz         not null default now(),
  updated_at      timestamptz         not null default now(),

  check (ends_at > scheduled_at),

  -- garante que não existe outro agendamento ativo no mesmo slot para o mesmo profissional
  -- a validação forte fica na função atômica (V009), mas este check cobre inserts diretos
  constraint no_past_appointments check (scheduled_at > '2020-01-01'::timestamptz)
);

comment on column appointments.ends_at    is 'Desnormalizado para simplificar queries de disponibilidade';
comment on column appointments.source     is 'De onde veio o agendamento';
comment on column appointments.tenant_id  is 'NULL no single-tenant. FK para tenants no multi-tenant.';

-- Auditoria: todo status change gera um registro
create table appointment_status_history (
  id             uuid        primary key default gen_random_uuid(),
  appointment_id uuid        not null references appointments(id) on delete cascade,
  from_status    appointment_status,              -- NULL na criação
  to_status      appointment_status not null,
  changed_by     text        not null,            -- 'ia' | 'client' | 'dashboard' | 'system'
  reason         text,
  created_at     timestamptz not null default now()
);

comment on table appointment_status_history is 'Log imutável de todas as mudanças de status';
