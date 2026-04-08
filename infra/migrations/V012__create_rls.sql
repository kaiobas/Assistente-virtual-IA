-- V012__create_rls.sql
-- Row Level Security
-- Single-tenant: habilita RLS mas políticas permitem tudo para service_role
-- Multi-tenant: adicionar policies com tenant_id = auth.jwt()->>'tenant_id'

-- ─────────────────────────────────────────────────────────────
-- NOTA PARA MULTI-TENANT NO FUTURO
-- Substituir as policies "allow_service_role" por:
--
-- create policy "tenant_isolation" on <tabela>
--   using (tenant_id = (auth.jwt()->>'tenant_id')::uuid);
--
-- E adicionar tenant_id nos INSERTs via default:
--   tenant_id uuid not null default (auth.jwt()->>'tenant_id')::uuid
-- ─────────────────────────────────────────────────────────────

-- Habilita RLS em todas as tabelas
alter table business                    enable row level security;
alter table clients                     enable row level security;
alter table professionals               enable row level security;
alter table services                    enable row level security;
alter table professional_services       enable row level security;
alter table availability_rules          enable row level security;
alter table availability_exceptions     enable row level security;
alter table appointments                enable row level security;
alter table appointment_status_history  enable row level security;
alter table conversation_sessions       enable row level security;
alter table conversation_messages       enable row level security;
alter table notification_queue          enable row level security;
alter table notification_log            enable row level security;


-- ─────────────────────────────────────────────────────────────
-- Políticas single-tenant:
-- service_role (n8n, backend) tem acesso total
-- anon não acessa nada
-- ─────────────────────────────────────────────────────────────

-- Macro para criar policy de acesso total para service_role
-- (repetida por tabela para ser explícita e auditável)

create policy "service_role_all" on business
  for all to service_role using (true) with check (true);

create policy "service_role_all" on clients
  for all to service_role using (true) with check (true);

create policy "service_role_all" on professionals
  for all to service_role using (true) with check (true);

create policy "service_role_all" on services
  for all to service_role using (true) with check (true);

create policy "service_role_all" on professional_services
  for all to service_role using (true) with check (true);

create policy "service_role_all" on availability_rules
  for all to service_role using (true) with check (true);

create policy "service_role_all" on availability_exceptions
  for all to service_role using (true) with check (true);

create policy "service_role_all" on appointments
  for all to service_role using (true) with check (true);

create policy "service_role_all" on appointment_status_history
  for all to service_role using (true) with check (true);

create policy "service_role_all" on conversation_sessions
  for all to service_role using (true) with check (true);

create policy "service_role_all" on conversation_messages
  for all to service_role using (true) with check (true);

create policy "service_role_all" on notification_queue
  for all to service_role using (true) with check (true);

create policy "service_role_all" on notification_log
  for all to service_role using (true) with check (true);


-- ─────────────────────────────────────────────────────────────
-- Dashboard (authenticated): acesso de leitura ao próprio negócio
-- Quando adicionar auth do dono no dashboard, criar policies aqui
-- ─────────────────────────────────────────────────────────────
-- Exemplo do que vai aqui quando o dashboard tiver login:
--
-- create policy "owner_read_appointments" on appointments
--   for select to authenticated
--   using (business_id = (auth.jwt()->>'business_id')::uuid);
--
-- create policy "owner_write_appointments" on appointments
--   for update to authenticated
--   using (business_id = (auth.jwt()->>'business_id')::uuid);
