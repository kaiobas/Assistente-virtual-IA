-- V003__create_clients.sql
-- Clientes que interagem via WhatsApp

create type ia_status_enum as enum ('active', 'human_takeover', 'blocked');

create table clients (
  id               uuid           primary key default gen_random_uuid(),
  tenant_id        uuid                       default null,     -- futuro: FK para tenants
  business_id      uuid           not null references business(id) on delete cascade,
  name             text,                                        -- pode ser null no primeiro contato
  phone            text           not null,
  email            text,
  ia_status        ia_status_enum not null default 'active',
  notes            text,                                        -- observações internas do dono
  first_contact_at timestamptz    not null default now(),
  last_contact_at  timestamptz    not null default now(),
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now(),

  unique (business_id, phone)                                   -- mesmo phone pode existir em negócios diferentes
);

comment on table  clients             is 'Clientes que interagem via WhatsApp';
comment on column clients.tenant_id   is 'NULL no single-tenant. FK para tenants no multi-tenant.';
comment on column clients.ia_status   is 'Controla se a IA responde ou passa para humano';
comment on column clients.notes       is 'Campo livre para o dono anotar preferências do cliente';
