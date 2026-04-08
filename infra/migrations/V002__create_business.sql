-- V002__create_business.sql
-- Configuração central do negócio (1 registro por deploy agora)
-- tenant_id NULL hoje → preenchido quando for multi-tenant

create table business (
  id                uuid        primary key default gen_random_uuid(),
  tenant_id         uuid                    default null,       -- futuro: FK para tenants
  name              text        not null,
  segment           text        not null,                       -- barbearia · clinica · salao
  phone_number      text        not null unique,                -- número da instância WhatsApp
  timezone          text        not null default 'America/Cuiaba',
  agent_name        text        not null default 'Assistente',  -- nome da IA para o cliente
  agent_persona     text,                                       -- system prompt base da IA
  business_rules    jsonb       not null default '{}',          -- regras livres por segmento
  -- ex: {"requer_email": false, "max_dias_antecedencia": 30, "permite_remarcacao": true}
  modules_enabled   jsonb       not null default '{"dashboard": false, "notifications": false, "reports": false}',
  active            boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table  business                  is 'Configuração central do negócio atendido';
comment on column business.tenant_id        is 'NULL no single-tenant. FK para tenants no multi-tenant.';
comment on column business.agent_persona    is 'System prompt base injetado no agente IA';
comment on column business.business_rules   is 'Regras de negócio flexíveis em JSON';
comment on column business.modules_enabled  is 'Módulos contratados pelo cliente';
