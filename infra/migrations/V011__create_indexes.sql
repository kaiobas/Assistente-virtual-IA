-- V011__create_indexes.sql
-- Índices de performance para as queries mais frequentes

-- ─── clients ───────────────────────────────
-- Lookup por phone é a query mais executada (toda mensagem nova)
create index idx_clients_phone          on clients (phone);
create index idx_clients_business_id    on clients (business_id);
create index idx_clients_ia_status      on clients (ia_status) where ia_status != 'active';

-- ─── professionals ─────────────────────────
create index idx_professionals_business on professionals (business_id) where active = true;

-- ─── services ──────────────────────────────
create index idx_services_business      on services (business_id) where active = true;
create index idx_services_category      on services (business_id, category) where active = true;

-- ─── professional_services ─────────────────
create index idx_prof_services_prof     on professional_services (professional_id) where active = true;
create index idx_prof_services_service  on professional_services (service_id) where active = true;

-- ─── availability_rules ────────────────────
create index idx_avail_rules_prof_dow   on availability_rules (professional_id, day_of_week) where active = true;

-- ─── availability_exceptions ───────────────
create index idx_avail_exc_prof_date    on availability_exceptions (professional_id, date);

-- ─── appointments ──────────────────────────
-- Query de conflito de slot (usada em create_appointment e get_available_slots)
create index idx_appointments_slot_check on appointments (professional_id, scheduled_at, ends_at)
  where status not in ('cancelled_by_client', 'cancelled_by_business', 'cancelled_auto', 'no_show');

-- Dashboard: agendamentos por negócio e data
create index idx_appointments_business_date on appointments (business_id, scheduled_at);

-- Agendamentos por cliente
create index idx_appointments_client       on appointments (client_id, scheduled_at);

-- ─── appointment_status_history ────────────
create index idx_status_history_appointment on appointment_status_history (appointment_id, created_at);

-- ─── conversation_sessions ─────────────────
-- n8n busca sessão pelo session_id em toda mensagem
create index idx_sessions_session_id        on conversation_sessions (session_id);
create index idx_sessions_client            on conversation_sessions (client_id, status);

-- ─── conversation_messages ─────────────────
create index idx_messages_session_created   on conversation_messages (session_id, created_at);

-- ─── notification_queue ────────────────────
-- Schedule trigger do n8n: status=pending AND send_at <= now()
create index idx_notif_queue_pending        on notification_queue (send_at, status)
  where status = 'pending';

create index idx_notif_queue_appointment    on notification_queue (appointment_id);

-- ─── Busca textual por nome de cliente (pg_trgm) ─────
create index idx_clients_name_trgm on clients using gin (name gin_trgm_ops);
