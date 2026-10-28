-- «¿Qué te frena?» al dejar la verificación del teléfono o de la identidad (historia #234). De la
-- persona queda solo que ya se le hizo la pregunta de ese nivel (research R1); la respuesta y la
-- pregunta abierta no tienen nada que las una a nadie (R3). Todas las tablas sin políticas: las leen
-- y escriben las funciones de abajo.

-- ---------------------------------------------------------------------------------------------
-- Las reglas cerradas: la misma lista que EXIT_OPTIONS en lib/verification/exit-question.ts (R6)
-- ---------------------------------------------------------------------------------------------

create or replace function private.verification_exit_option_valid(p_level text, p_option text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_level
           when 'phone' then p_option in ('no_number', 'no_code', 'later', 'groups', 'other')
           when 'identity' then p_option in ('no_id_photos', 'later', 'too_much', 'groups', 'other')
           else false
         end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Las tablas
-- ---------------------------------------------------------------------------------------------

create table public.verification_exit_asks (
  person_id uuid not null references auth.users (id) on delete cascade,
  level text not null,

  primary key (person_id, level),
  constraint verification_exit_asks_level_valid check (level in ('phone', 'identity'))
);

comment on table public.verification_exit_asks is
  'A quién ya se le hizo la pregunta de cada nivel, sin el día ni la respuesta (historia #234, FR-024).';

alter table public.verification_exit_asks enable row level security;
revoke all on public.verification_exit_asks from anon, authenticated;

create table public.verification_exit_tickets (
  ticket uuid primary key default gen_random_uuid(),
  level text not null,
  origin text not null,

  constraint verification_exit_tickets_level_valid check (level in ('phone', 'identity')),
  constraint verification_exit_tickets_origin_valid check (origin in ('publish', 'apply', 'self'))
);

comment on table public.verification_exit_tickets is
  'La pregunta hecha y todavía sin resolver, sin la persona: contestarla o seguir la borra (R3).';

alter table public.verification_exit_tickets enable row level security;
revoke all on public.verification_exit_tickets from anon, authenticated;

create table public.verification_exit_answers (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  option text not null,
  origin text not null,
  body text,
  answered_on date not null default public.uruguay_today(),

  constraint verification_exit_answers_level_valid check (level in ('phone', 'identity')),
  constraint verification_exit_answers_option_valid check (
    private.verification_exit_option_valid(level, option)
  ),
  constraint verification_exit_answers_origin_valid check (origin in ('publish', 'apply', 'self')),
  constraint verification_exit_answers_body_valid check (
    body is null or (option = 'other' and char_length(body) between 1 and 300)
  )
);

comment on table public.verification_exit_answers is
  'Las respuestas, sin la persona, el animal ni la hora (FR-025, Ley 18.331).';

create index verification_exit_answers_written_idx
  on public.verification_exit_answers (level, answered_on desc, id)
  where body is not null;

create index verification_exit_answers_counts_idx
  on public.verification_exit_answers (level, origin, option);

alter table public.verification_exit_answers enable row level security;
revoke all on public.verification_exit_answers from anon, authenticated;

-- Preguntadas y seguidas sin contestar, aparte de las marcas: borrar una cuenta no cambia ningún
-- número (FR-023).
create table public.verification_exit_counts (
  level text not null,
  origin text not null,
  asked integer not null default 0,
  skipped integer not null default 0,

  primary key (level, origin),
  constraint verification_exit_counts_level_valid check (level in ('phone', 'identity')),
  constraint verification_exit_counts_origin_valid check (origin in ('publish', 'apply', 'self')),
  constraint verification_exit_counts_asked_valid check (asked >= 0),
  constraint verification_exit_counts_skipped_valid check (skipped >= 0 and skipped <= asked)
);

insert into public.verification_exit_counts (level, origin)
select l.level, o.origin
  from (values ('phone'), ('identity')) as l (level)
 cross join (values ('publish'), ('apply'), ('self')) as o (origin);

alter table public.verification_exit_counts enable row level security;
revoke all on public.verification_exit_counts from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Cuándo corresponde la pregunta (R2)
-- ---------------------------------------------------------------------------------------------

-- Nunca verificó ese nivel, todavía no se le preguntó y la cuenta no está suspendida. El teléfono
-- perdido (#25) deja la cuenta sin `verified_at`, pero la marca `number_lost_on`: ya lo verificó.
-- Un cambio a medias conserva `verified_at`, así «Cancelar el cambio» queda afuera solo.
create or replace function private.verification_exit_eligible(p_person uuid, p_level text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    p_person is not null
    and p_level in ('phone', 'identity')
    and not exists (
      select 1 from public.verification_exit_asks a
       where a.person_id = p_person and a.level = p_level
    )
    and not private.is_suspended(p_person)
    and case p_level
          when 'phone' then not exists (
            select 1 from public.phones p
             where p.user_id = p_person
               and (p.verified_at is not null or p.number_lost_on is not null)
          )
          when 'identity' then not exists (
            select 1 from public.identity_verifications v where v.user_id = p_person
          )
        end,
    false
  );
$$;

-- Si «Ahora no» de quien llama tiene que preguntar. Falso sin sesión.
create or replace function public.verification_exit_due(p_level text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.verification_exit_eligible((select auth.uid()), p_level);
$$;

-- ---------------------------------------------------------------------------------------------
-- Preguntar, contestar y seguir sin contestar (R3)
-- ---------------------------------------------------------------------------------------------

-- Hace la pregunta: pone la marca y devuelve un ticket sin persona. Nulo si no corresponde, si el
-- nivel o el origen no son, o si otra llamada ya puso la marca (la clave primaria hace esperar a la
-- segunda, que después no inserta).
create or replace function public.ask_verification_exit(p_level text, p_origin text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid := (select auth.uid());
  v_ticket uuid;
begin
  if p_origin is null or p_origin not in ('publish', 'apply', 'self')
     or not private.verification_exit_eligible(v_person, p_level) then
    return null;
  end if;

  insert into public.verification_exit_asks (person_id, level)
  values (v_person, p_level)
  on conflict do nothing;
  if not found then
    return null;
  end if;

  update public.verification_exit_counts c
     set asked = c.asked + 1
   where c.level = p_level and c.origin = p_origin;
  insert into public.verification_exit_tickets (level, origin)
  values (p_level, p_origin)
  returning ticket into v_ticket;
  return v_ticket;
end;
$$;

-- Contesta, una sola vez por ticket (FR-014).
--   answered  quedó la respuesta, con el nivel y el origen del ticket
--   already   el ticket ya no está: el doble toque, el reintento, la otra pestaña
--   invalid   la opción no es de ese nivel, o el texto no va con ella o pasa de 300; el ticket queda
create or replace function public.answer_verification_exit(
  p_ticket uuid,
  p_option text,
  p_body text default null
)
returns table (outcome text, level text, origin text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
  v_ticket public.verification_exit_tickets%rowtype;
begin
  select * into v_ticket
    from public.verification_exit_tickets t
   where t.ticket = p_ticket
     for update;
  if not found then
    return query select 'already'::text, null::text, null::text;
    return;
  end if;
  if not private.verification_exit_option_valid(v_ticket.level, p_option)
     or (v_body is not null and (p_option <> 'other' or char_length(v_body) > 300)) then
    return query select 'invalid'::text, v_ticket.level, v_ticket.origin;
    return;
  end if;

  with taken as (
    delete from public.verification_exit_tickets t
     where t.ticket = p_ticket
    returning t.level, t.origin
  )
  insert into public.verification_exit_answers (level, option, origin, body)
  select taken.level, p_option, taken.origin, v_body from taken;
  return query select 'answered'::text, v_ticket.level, v_ticket.origin;
end;
$$;

-- «Seguir sin contestar».
--   skipped  el ticket se resolvió sin respuesta
--   already  el ticket ya no está
create or replace function public.skip_verification_exit(p_ticket uuid)
returns table (outcome text, level text, origin text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_level text;
  v_origin text;
begin
  delete from public.verification_exit_tickets t
   where t.ticket = p_ticket
  returning t.level, t.origin into v_level, v_origin;
  if not found then
    return query select 'already'::text, null::text, null::text;
    return;
  end if;

  update public.verification_exit_counts c
     set skipped = c.skipped + 1
   where c.level = v_level and c.origin = v_origin;
  return query select 'skipped'::text, v_level, v_origin;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.verification_exit_option_valid(text, text)
  from public, anon, authenticated;
revoke all on function private.verification_exit_eligible(uuid, text)
  from public, anon, authenticated;
revoke all on function public.verification_exit_due(text) from public, anon, authenticated;
revoke all on function public.ask_verification_exit(text, text) from public, anon, authenticated;
revoke all on function public.answer_verification_exit(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.skip_verification_exit(uuid) from public, anon, authenticated;

grant execute on function public.verification_exit_due(text) to authenticated;
grant execute on function public.ask_verification_exit(text, text) to authenticated;
grant execute on function public.answer_verification_exit(uuid, text, text) to authenticated;
grant execute on function public.skip_verification_exit(uuid) to authenticated;
