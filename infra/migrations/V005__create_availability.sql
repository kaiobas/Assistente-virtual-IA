-- V005__create_availability.sql
-- Regras de disponibilidade de cada profissional

-- Grade horária regular (o que se repete toda semana)
create table availability_rules (
  id              uuid        primary key default gen_random_uuid(),
  professional_id uuid        not null references professionals(id) on delete cascade,
  day_of_week     integer     not null check (day_of_week between 0 and 6), -- 0=dom, 6=sab
  start_time      time        not null,
  end_time        time        not null,
  active          boolean     not null default true,

  check (end_time > start_time)
);

comment on table  availability_rules              is 'Grade horária semanal padrão do profissional';
comment on column availability_rules.day_of_week  is '0=domingo, 1=segunda, ..., 6=sábado';

-- Exceções pontuais: folgas, feriados, horários extras
create type availability_exception_type as enum ('day_off', 'extra_hours', 'partial');

create table availability_exceptions (
  id              uuid                         primary key default gen_random_uuid(),
  professional_id uuid                         not null references professionals(id) on delete cascade,
  date            date                         not null,
  type            availability_exception_type  not null,
  start_time      time,                         -- NULL quando day_off (dia todo)
  end_time        time,                         -- NULL quando day_off
  reason          text,                         -- "Natal", "Consulta médica", etc.
  created_at      timestamptz                  not null default now(),

  check (
    (type = 'day_off' and start_time is null and end_time is null)
    or
    (type != 'day_off' and start_time is not null and end_time is not null and end_time > start_time)
  )
);

comment on table availability_exceptions is 'Sobreescreve a grade padrão em datas específicas';
comment on column availability_exceptions.type is 'day_off=folga total, extra_hours=trabalha fora do padrão, partial=trabalha menos';
