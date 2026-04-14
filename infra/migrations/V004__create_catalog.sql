-- V004__create_catalog.sql
-- Profissionais, serviços e vínculo entre eles

create table professionals (
  id           uuid        primary key default gen_random_uuid(),
  tenant_id    uuid                    default null,
  business_id  uuid        not null references business(id) on delete cascade,
  name         text        not null,
  display_name text        not null,   -- como a IA menciona: "Gustavo" em vez de "Gustavo Cruz"
  specialty    text,                   -- ex: "Coloração e química"
  avatar_url   text,
  active       boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table services (
  id           uuid           primary key default gen_random_uuid(),
  tenant_id    uuid                       default null,
  business_id  uuid           not null references business(id) on delete cascade,
  name         text           not null,
  description  text,
  duration_min integer        not null check (duration_min > 0),
  price        numeric(10, 2) not null check (price >= 0),
  category     text,                      -- corte · barba · quimica · estetica...
  active       boolean        not null default true,
  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now()
);

-- Vínculo: qual profissional faz qual serviço
-- Permite preço e duração customizados por profissional
create table professional_services (
  id                  uuid           primary key default gen_random_uuid(),
  professional_id     uuid           not null references professionals(id) on delete cascade,
  service_id          uuid           not null references services(id) on delete cascade,
  custom_duration_min integer                   check (custom_duration_min > 0),  -- NULL = usa o padrão
  custom_price        numeric(10, 2)            check (custom_price >= 0),         -- NULL = usa o padrão
  active              boolean        not null default true,

  unique (professional_id, service_id)
);

comment on column professional_services.custom_duration_min is 'NULL = herda duration_min de services';
comment on column professional_services.custom_price        is 'NULL = herda price de services';
