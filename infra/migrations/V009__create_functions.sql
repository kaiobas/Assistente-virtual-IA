-- V009__create_functions.sql
-- Funções de lógica de negócio

-- ─────────────────────────────────────────────
-- 1. Insert atômico de agendamento
--    Garante que não existe conflito de slot
--    O n8n chama esta função ao invés de INSERT direto
-- ─────────────────────────────────────────────
create or replace function create_appointment(
  p_business_id      uuid,
  p_client_id        uuid,
  p_professional_id  uuid,
  p_service_id       uuid,
  p_scheduled_at     timestamptz,
  p_source           appointment_source default 'whatsapp',
  p_notes            text              default null
)
returns appointments
language plpgsql
as $$
declare
  v_duration_min  integer;
  v_ends_at       timestamptz;
  v_conflict      integer;
  v_appointment   appointments;
begin
  -- 1. Resolve duração: custom do profissional ou padrão do serviço
  select coalesce(ps.custom_duration_min, s.duration_min)
    into v_duration_min
    from services s
    left join professional_services ps
      on ps.service_id = s.id
     and ps.professional_id = p_professional_id
   where s.id = p_service_id;

  if v_duration_min is null then
    raise exception 'Serviço % não encontrado ou não vinculado ao profissional %',
      p_service_id, p_professional_id;
  end if;

  v_ends_at := p_scheduled_at + (v_duration_min || ' minutes')::interval;

  -- 2. Lock no profissional para evitar race condition
  perform pg_advisory_xact_lock(hashtext(p_professional_id::text));

  -- 3. Verifica conflito de slot (apenas agendamentos ativos)
  select count(*) into v_conflict
    from appointments
   where professional_id = p_professional_id
     and status not in ('cancelled_by_client', 'cancelled_by_business', 'cancelled_auto', 'no_show')
     and scheduled_at < v_ends_at
     and ends_at > p_scheduled_at;

  if v_conflict > 0 then
    raise exception 'Horário indisponível: profissional já tem agendamento neste slot';
  end if;

  -- 4. Cria o agendamento
  insert into appointments (
    business_id, client_id, professional_id, service_id,
    scheduled_at, ends_at, source, notes
  )
  values (
    p_business_id, p_client_id, p_professional_id, p_service_id,
    p_scheduled_at, v_ends_at, p_source, p_notes
  )
  returning * into v_appointment;

  return v_appointment;
end;
$$;

comment on function create_appointment is 'Insert atômico com lock por profissional. Usar sempre no lugar de INSERT direto.';


-- ─────────────────────────────────────────────
-- 2. Busca slots disponíveis de um profissional
--    Retorna horários livres em um intervalo de data
-- ─────────────────────────────────────────────
create or replace function get_available_slots(
  p_professional_id  uuid,
  p_service_id       uuid,
  p_date_start       date,
  p_date_end         date     default null,   -- NULL = mesmo dia que start
  p_slot_interval    interval default '30 minutes'
)
returns table (
  slot_start  timestamptz,
  slot_end    timestamptz,
  available   boolean
)
language plpgsql
as $$
declare
  v_duration_min  integer;
  v_date          date;
  v_dow           integer;
  v_tz            text;
  v_rule          record;
  v_slot          timestamptz;
  v_slot_end      timestamptz;
  v_conflict      integer;
begin
  if p_date_end is null then
    p_date_end := p_date_start;
  end if;

  -- Duração do serviço
  select coalesce(ps.custom_duration_min, s.duration_min)
    into v_duration_min
    from services s
    left join professional_services ps
      on ps.service_id = s.id
     and ps.professional_id = p_professional_id
   where s.id = p_service_id;

  -- Timezone do negócio
  select b.timezone into v_tz
    from professionals p
    join business b on b.id = p.business_id
   where p.id = p_professional_id;

  v_date := p_date_start;

  while v_date <= p_date_end loop
    v_dow := extract(dow from v_date);

    -- Verifica exceção para este dia
    if exists (
      select 1 from availability_exceptions
      where professional_id = p_professional_id
        and date = v_date
        and type = 'day_off'
    ) then
      v_date := v_date + 1;
      continue;
    end if;

    -- Itera sobre turnos do dia
    for v_rule in
      select start_time, end_time
        from availability_rules
       where professional_id = p_professional_id
         and day_of_week = v_dow
         and active = true
       order by start_time
    loop
      v_slot := (v_date::text || ' ' || v_rule.start_time::text || ' ' || v_tz)::timestamptz;

      while v_slot + (v_duration_min || ' minutes')::interval <= 
            (v_date::text || ' ' || v_rule.end_time::text || ' ' || v_tz)::timestamptz
      loop
        v_slot_end := v_slot + (v_duration_min || ' minutes')::interval;

        select count(*) into v_conflict
          from appointments
         where professional_id = p_professional_id
           and status not in ('cancelled_by_client', 'cancelled_by_business', 'cancelled_auto', 'no_show')
           and scheduled_at < v_slot_end
           and ends_at > v_slot;

        slot_start := v_slot;
        slot_end   := v_slot_end;
        available  := (v_conflict = 0);
        return next;

        v_slot := v_slot + p_slot_interval;
      end loop;
    end loop;

    v_date := v_date + 1;
  end loop;
end;
$$;

comment on function get_available_slots is 'Retorna todos os slots de um profissional com flag de disponível ou não';


-- ─────────────────────────────────────────────
-- 3. updated_at automático
-- ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
