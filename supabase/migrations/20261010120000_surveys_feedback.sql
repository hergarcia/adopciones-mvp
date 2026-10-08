-- La encuesta de los tres desenlaces, las opiniones de Opinar y lo que lee quien administra (historia
-- #71). De la persona se guarda solo la oferta (research R1); las respuestas y las opiniones no tienen
-- nada que las una a nadie y llevan solo el día (R4, R8). Todas las tablas sin políticas: las leen y
-- escriben las funciones de abajo.

-- ---------------------------------------------------------------------------------------------
-- Las reglas cerradas
-- ---------------------------------------------------------------------------------------------

create or replace function private.survey_option_valid(p_moment text, p_option text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_moment
           when 'gave' then p_option in ('yes', 'maybe', 'no')
           when 'adopted' then p_option in ('yes', 'somewhat', 'no')
           when 'not_chosen' then p_option in ('yes', 'maybe', 'back_to_groups')
           else false
         end;
$$;

-- La lista de research R9: la de `FEEDBACK_SCREENS` en lib/feedback/types.ts.
create or replace function private.feedback_screen_valid(p_screen text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_screen in (
    'pet', 'profile', 'home', 'listing', 'levels', 'my_pets', 'my_application', 'my_applications',
    'publisher_applications', 'my_profile', 'verification', 'review', 'sign_in', 'suspended', 'other'
  );
$$;

-- ---------------------------------------------------------------------------------------------
-- Las tablas
-- ---------------------------------------------------------------------------------------------

create table public.survey_offers (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references auth.users (id) on delete cascade,
  moment text not null,
  -- La adopción (`gave`, `adopted`) o la solicitud (`not_chosen`): apunta a dos tablas, sin FK (R1).
  subject_id uuid not null,
  offered_on date,
  state text not null,

  constraint survey_offers_subject_unique unique (person_id, moment, subject_id),
  constraint survey_offers_moment_valid check (moment in ('gave', 'adopted', 'not_chosen')),
  constraint survey_offers_state_valid check (state in ('pending', 'answered', 'dismissed', 'skipped')),
  constraint survey_offers_skipped check ((state = 'skipped') = (offered_on is null))
);

comment on table public.survey_offers is
  'A quién se le ofreció la encuesta, de qué desenlace, qué día y en qué quedó (historia #71, R1). '
  '`skipped`: cayó dentro de los 30 días de la anterior y no se ofrece nunca.';

create index survey_offers_window_idx on public.survey_offers (person_id, offered_on desc)
  where state <> 'skipped';

alter table public.survey_offers enable row level security;
revoke all on public.survey_offers from anon, authenticated;

create table public.survey_answers (
  id uuid primary key default gen_random_uuid(),
  moment text not null,
  option text not null,
  body text,
  answered_on date not null default public.uruguay_today(),

  constraint survey_answers_option_valid check (private.survey_option_valid(moment, option)),
  constraint survey_answers_body_valid check (body is null or char_length(body) between 1 and 500)
);

comment on table public.survey_answers is
  'Las respuestas de la encuesta, sin nada que las una a la persona ni a la oferta (FR-051, R4).';

create index survey_answers_written_idx on public.survey_answers (moment, answered_on desc, id)
  where body is not null;

alter table public.survey_answers enable row level security;
revoke all on public.survey_answers from anon, authenticated;

-- Ofrecidas y cerradas, aparte de las ofertas: borrar una cuenta no cambia ningún número (FR-044).
create table public.survey_counts (
  moment text primary key,
  offered integer not null default 0,
  dismissed integer not null default 0,

  constraint survey_counts_moment_valid check (moment in ('gave', 'adopted', 'not_chosen')),
  constraint survey_counts_offered_valid check (offered >= 0),
  constraint survey_counts_dismissed_valid check (dismissed >= 0)
);

insert into public.survey_counts (moment) values ('gave'), ('adopted'), ('not_chosen');

alter table public.survey_counts enable row level security;
revoke all on public.survey_counts from anon, authenticated;

-- Desde cuándo un desenlace ofrece encuesta (R6): el arranque de cada base, no la fecha del PR.
create table private.survey_settings (
  only_row boolean primary key default true,
  since timestamptz not null default now(),

  constraint survey_settings_one_row check (only_row)
);

insert into private.survey_settings default values;

revoke all on private.survey_settings from public, anon, authenticated;

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  screen text not null,
  subject text,
  sent_on date not null default public.uruguay_today(),
  attempt_id uuid not null,

  constraint feedback_attempt_unique unique (attempt_id),
  constraint feedback_body_valid check (char_length(btrim(body)) between 1 and 1000),
  constraint feedback_screen_valid check (private.feedback_screen_valid(screen)),
  constraint feedback_subject_valid check (
    subject is null or (screen in ('pet', 'profile') and char_length(subject) between 1 and 64)
  )
);

comment on table public.feedback is
  'Las opiniones de Opinar, sin la persona, el navegador ni la hora (FR-051, R8).';

create index feedback_recent_idx on public.feedback (sent_on desc, id);

alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;

-- El tope del día por navegador (FR-023), sin decir cuáles mandó: muere al otro día.
create table public.feedback_quota (
  browser_hash text not null,
  day date not null,
  sent smallint not null,

  primary key (browser_hash, day),
  constraint feedback_quota_sent_valid check (sent between 1 and 5)
);

alter table public.feedback_quota enable row level security;
revoke all on public.feedback_quota from anon, authenticated;

-- Una oferta solo avanza de `pending` a respondida o cerrada; lo demás no cambia.
create or replace function private.survey_offers_forward_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.person_id is distinct from old.person_id
     or new.moment is distinct from old.moment
     or new.subject_id is distinct from old.subject_id
     or new.offered_on is distinct from old.offered_on
     or (
       new.state is distinct from old.state
       and (old.state <> 'pending' or new.state not in ('answered', 'dismissed'))
     ) then
    raise exception using errcode = 'P0001', message = 'survey_offer_forward_only';
  end if;
  return new;
end;
$$;

create trigger survey_offers_forward_only
  before update on public.survey_offers
  for each row execute function private.survey_offers_forward_only();

-- ---------------------------------------------------------------------------------------------
-- La oferta (R2, R3)
-- ---------------------------------------------------------------------------------------------

-- La oferta de un desenlace ya comprobado: la que hay, o una nueva. Nueva es `pending` si ninguna
-- oferta vista de la persona tiene menos de 30 días, y `skipped` para siempre si no (FR-005). El
-- candado por persona hace que dos pestañas no dejen dos `pending`.
create or replace function private.offer_survey(p_person uuid, p_moment text, p_subject uuid)
returns table (offer_id uuid, state text, newly_offered boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.survey_offers%rowtype;
  v_today date := public.uruguay_today();
begin
  perform pg_advisory_xact_lock(hashtextextended('survey-person:' || p_person::text, 0));

  select * into v_offer
    from public.survey_offers o
   where o.person_id = p_person and o.moment = p_moment and o.subject_id = p_subject;
  if found then
    return query select v_offer.id, v_offer.state, false;
    return;
  end if;

  if exists (
    select 1 from public.survey_offers o
     where o.person_id = p_person
       and o.state <> 'skipped'
       and o.offered_on > v_today - 30
  ) then
    insert into public.survey_offers (person_id, moment, subject_id, offered_on, state)
    values (p_person, p_moment, p_subject, null, 'skipped')
    returning * into v_offer;
    return query select v_offer.id, v_offer.state, false;
    return;
  end if;

  insert into public.survey_offers (person_id, moment, subject_id, offered_on, state)
  values (p_person, p_moment, p_subject, v_today, 'pending')
  returning * into v_offer;
  update public.survey_counts c set offered = c.offered + 1 where c.moment = p_moment;
  return query select v_offer.id, v_offer.state, true;
end;
$$;

-- Cuándo pasó el desenlace de quien llama, o null si no es suyo o no es uno de los de R3.
--   gave        una adopción vigente que marcó (por el sitio o por fuera)
--   adopted     una adopción del sitio que la eligió y que no deshizo con «Yo no adopté»
--   not_chosen  su solicitud rechazada (también la aceptación sin efecto) o cerrada porque el animal
--               encontró hogar con otra persona; no la propia que cerró «Yo no adopté»
create or replace function private.survey_outcome_at(p_person uuid, p_moment text, p_subject uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select case p_moment
    when 'gave' then (
      select d.marked_at from public.adoptions d
       where d.id = p_subject and d.publisher_id = p_person and d.ended_at is null
    )
    when 'adopted' then (
      select d.marked_at from public.adoptions d
       where d.id = p_subject and d.kind = 'site' and d.adopter_id = p_person
         and d.declined_at is null
    )
    when 'not_chosen' then (
      select case when a.status = 'rejected' then coalesce(r.rejected_at, a.changed_at)
                  else a.changed_at end
        from public.applications a
        left join public.application_reviews r on r.application_id = a.id
       where a.id = p_subject
         and a.applicant_id = p_person
         and (a.status = 'rejected' or (a.status = 'closed' and a.close_reason = 'adopted'))
         and not exists (
           select 1 from public.adoptions d
            where d.application_id = a.id and d.declined_at is not null
         )
    )
  end;
$$;

-- La encuesta de una solicitud propia, al abrir Mi solicitud: `adopted` por la adopción más reciente
-- que la eligió (Mi solicitud no conoce la adopción, solo la solicitud), `not_chosen` por la solicitud
-- misma. Nada si el desenlace no es suyo, no es de R3, es de antes del arranque (R6) o la cuenta está
-- suspendida (FR-008). `gave` se ofrece solo desde Mis animales.
create or replace function public.survey_for(p_moment text, p_application uuid)
returns table (offer_id uuid, moment text, state text, newly_offered boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid := (select auth.uid());
  v_subject uuid;
  v_at timestamptz;
begin
  if v_person is null or private.is_suspended(v_person) then
    return;
  end if;
  if p_moment = 'adopted' then
    select d.id into v_subject
      from public.adoptions d
     where d.application_id = p_application and d.adopter_id = v_person
     order by d.marked_at desc
     limit 1;
  elsif p_moment = 'not_chosen' then
    v_subject := p_application;
  end if;
  v_at := private.survey_outcome_at(v_person, p_moment, v_subject);
  if v_at is null or v_at < (select s.since from private.survey_settings s) then
    return;
  end if;
  return query
    select o.offer_id, p_moment, o.state, o.newly_offered
      from private.offer_survey(v_person, p_moment, v_subject) o;
end;
$$;

-- Mis animales: ofrece por las adopciones vigentes sin oferta, de la más nueva a la más vieja (como
-- mucho una queda `pending`), y devuelve la pendiente más nueva de una adopción vigente, con su
-- animal. Una pendiente de un animal que se volvió a publicar sigue contada y no se muestra.
create or replace function public.my_pets_survey()
returns table (offer_id uuid, moment text, state text, newly_offered boolean, pet_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid := (select auth.uid());
  v_adoption uuid;
  v_new uuid;
  v_offer record;
begin
  if v_person is null or private.is_suspended(v_person) then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('survey-person:' || v_person::text, 0));

  for v_adoption in
    select d.id from public.adoptions d
     where d.publisher_id = v_person
       and d.ended_at is null
       and d.marked_at >= (select s.since from private.survey_settings s)
       and not exists (
         select 1 from public.survey_offers o
          where o.person_id = v_person and o.moment = 'gave' and o.subject_id = d.id
       )
     order by d.marked_at desc, d.id
  loop
    select * into v_offer from private.offer_survey(v_person, 'gave', v_adoption);
    if v_offer.newly_offered then
      v_new := v_offer.offer_id;
    end if;
  end loop;

  return query
    select o.id, o.moment, o.state, o.id is not distinct from v_new, d.pet_id
      from public.survey_offers o
      join public.adoptions d on d.id = o.subject_id and d.ended_at is null
     where o.person_id = v_person
       and o.moment = 'gave'
       and o.state = 'pending'
     order by o.offered_on desc, d.marked_at desc
     limit 1;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Responder y cerrar (R7)
-- ---------------------------------------------------------------------------------------------

-- Responde la encuesta propia, una sola vez (FR-010).
--   answered   quedó la respuesta
--   already    ya estaba respondida: no guarda otra
--   dismissed  se había cerrado con «Ahora no»: no guarda nada
--   not_found  no es una oferta pendiente de quien llama
--   invalid    la opción no es de ese momento o el texto pasa de 500
--   suspended  la cuenta está suspendida
create or replace function public.answer_survey(p_offer uuid, p_option text, p_body text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid := (select auth.uid());
  v_offer public.survey_offers%rowtype;
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
begin
  select * into v_offer
    from public.survey_offers o
   where o.id = p_offer and o.person_id = v_person
     for update;
  if not found or v_offer.state = 'skipped' then
    return 'not_found';
  end if;
  if private.is_suspended(v_person) then
    return 'suspended';
  end if;
  if v_offer.state = 'answered' then
    return 'already';
  end if;
  if v_offer.state = 'dismissed' then
    return 'dismissed';
  end if;
  if not private.survey_option_valid(v_offer.moment, p_option)
     or char_length(coalesce(v_body, '')) > 500 then
    return 'invalid';
  end if;

  insert into public.survey_answers (moment, option, body)
  values (v_offer.moment, p_option, v_body);
  update public.survey_offers o set state = 'answered' where o.id = v_offer.id;
  return 'answered';
end;
$$;

-- «Ahora no».
--   dismissed  quedó cerrada
--   already    ya estaba respondida o cerrada: no cuenta otra vez
--   not_found  no es una oferta pendiente de quien llama
--   suspended  la cuenta está suspendida
create or replace function public.dismiss_survey(p_offer uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid := (select auth.uid());
  v_offer public.survey_offers%rowtype;
begin
  select * into v_offer
    from public.survey_offers o
   where o.id = p_offer and o.person_id = v_person
     for update;
  if not found or v_offer.state = 'skipped' then
    return 'not_found';
  end if;
  if private.is_suspended(v_person) then
    return 'suspended';
  end if;
  if v_offer.state <> 'pending' then
    return 'already';
  end if;

  update public.survey_offers o set state = 'dismissed' where o.id = v_offer.id;
  update public.survey_counts c set dismissed = c.dismissed + 1 where c.moment = v_offer.moment;
  return 'dismissed';
end;
$$;

-- «Yo no adopté» retira la encuesta sin responder de esa adopción (R5): no cuenta como ofrecida ni
-- para los 30 días. Una respondida queda.
create or replace function private.adoptions_decline_withdraws_survey()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_removed integer;
begin
  if old.declined_at is null and new.declined_at is not null then
    delete from public.survey_offers o
     where o.moment = 'adopted' and o.subject_id = new.id and o.state = 'pending';
    get diagnostics v_removed = row_count;
    if v_removed > 0 then
      update public.survey_counts c
         set offered = greatest(c.offered - v_removed, 0)
       where c.moment = 'adopted';
    end if;
  end if;
  return null;
end;
$$;

create trigger adoptions_decline_withdraws_survey
  after update of declined_at on public.adoptions
  for each row execute function private.adoptions_decline_withdraws_survey();

-- ---------------------------------------------------------------------------------------------
-- Opinar (R8)
-- ---------------------------------------------------------------------------------------------

-- Una opinión, con o sin sesión.
--   sent     quedó guardada
--   already  ese intento ya había llegado (doble toque, reintento)
--   limit    ese navegador ya mandó 5 hoy
--   invalid  vacía, de más de 1.000, de una pantalla desconocida o con un sujeto que no va
create or replace function public.send_feedback(
  p_browser_hash text,
  p_attempt uuid,
  p_body text,
  p_screen text,
  p_subject text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := public.uruguay_today();
  v_sent smallint;
begin
  if p_attempt is null then
    return 'invalid';
  end if;
  if exists (select 1 from public.feedback f where f.attempt_id = p_attempt) then
    return 'already';
  end if;
  if char_length(coalesce(p_browser_hash, '')) not between 1 and 128
     or char_length(btrim(coalesce(p_body, ''))) not between 1 and 1000
     or not coalesce(private.feedback_screen_valid(p_screen), false)
     or (
       p_subject is not null
       and (p_screen not in ('pet', 'profile') or char_length(p_subject) not between 1 and 64)
     ) then
    return 'invalid';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('feedback-browser:' || p_browser_hash, 0));
  delete from public.feedback_quota q where q.day < v_today;

  select q.sent into v_sent
    from public.feedback_quota q
   where q.browser_hash = p_browser_hash and q.day = v_today;
  if coalesce(v_sent, 0) >= 5 then
    return 'limit';
  end if;

  insert into public.feedback (body, screen, subject, attempt_id)
  values (btrim(p_body), p_screen, p_subject, p_attempt)
  on conflict (attempt_id) do nothing;
  if not found then
    return 'already';
  end if;

  insert into public.feedback_quota (browser_hash, day, sent)
  values (p_browser_hash, v_today, 1)
  on conflict (browser_hash, day) do update set sent = public.feedback_quota.sent + 1;
  return 'sent';
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Lo que lee quien administra (R12): nada para cualquier otra sesión
-- ---------------------------------------------------------------------------------------------

-- Las opiniones, de la más nueva a la más vieja por día y después por id, de a `p_limit`.
create or replace function public.admin_feedback(p_before_on date, p_before_id uuid, p_limit integer)
returns table (
  id uuid,
  body text,
  screen text,
  subject text,
  pet_name text,
  sent_on date
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.body, f.screen, f.subject, p.name, f.sent_on
    from public.feedback f
    left join public.pets p on f.screen = 'pet' and p.code = f.subject
   where private.is_admin()
     and (p_before_on is null or (f.sent_on, f.id) < (p_before_on, coalesce(p_before_id, f.id)))
   order by f.sent_on desc, f.id desc
   limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

--   deleted    quedó borrada
--   not_found  no existe, o quien llama no administra
create or replace function public.admin_delete_feedback(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    return 'not_found';
  end if;
  delete from public.feedback f where f.id = p_id;
  return case when found then 'deleted' else 'not_found' end;
end;
$$;

-- Una fila por momento y opción: ofrecidas y cerradas de las cuentas aparte (FR-044), respondidas y
-- por opción de las respuestas.
create or replace function public.admin_survey_summary()
returns table (
  moment text,
  offered integer,
  answered integer,
  dismissed integer,
  option text,
  chosen integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.moment,
         c.offered,
         (select count(*)::integer from public.survey_answers a where a.moment = c.moment),
         c.dismissed,
         o.option,
         (select count(*)::integer from public.survey_answers a
           where a.moment = c.moment and a.option = o.option)
    from public.survey_counts c
    join (
      values ('gave', 'yes', 1), ('gave', 'maybe', 2), ('gave', 'no', 3),
             ('adopted', 'yes', 1), ('adopted', 'somewhat', 2), ('adopted', 'no', 3),
             ('not_chosen', 'yes', 1), ('not_chosen', 'maybe', 2), ('not_chosen', 'back_to_groups', 3)
    ) as o (moment, option, position) on o.moment = c.moment
   where private.is_admin()
   order by array_position(array['gave', 'adopted', 'not_chosen'], c.moment), o.position;
$$;

-- Las respuestas con texto de un momento, de la más nueva a la más vieja, de a `p_limit`.
create or replace function public.admin_survey_answers(
  p_moment text,
  p_before_on date,
  p_before_id uuid,
  p_limit integer
)
returns table (id uuid, option text, body text, answered_on date)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.option, a.body, a.answered_on
    from public.survey_answers a
   where private.is_admin()
     and a.moment = p_moment
     and a.body is not null
     and (p_before_on is null
          or (a.answered_on, a.id) < (p_before_on, coalesce(p_before_id, a.id)))
   order by a.answered_on desc, a.id desc
   limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.survey_option_valid(text, text) from public, anon, authenticated;
revoke all on function private.feedback_screen_valid(text) from public, anon, authenticated;
revoke all on function private.survey_offers_forward_only() from public, anon, authenticated;
revoke all on function private.offer_survey(uuid, text, uuid) from public, anon, authenticated;
revoke all on function private.survey_outcome_at(uuid, text, uuid) from public, anon, authenticated;
revoke all on function private.adoptions_decline_withdraws_survey()
  from public, anon, authenticated;
revoke all on function public.survey_for(text, uuid) from public, anon, authenticated;
revoke all on function public.my_pets_survey() from public, anon, authenticated;
revoke all on function public.answer_survey(uuid, text, text) from public, anon, authenticated;
revoke all on function public.dismiss_survey(uuid) from public, anon, authenticated;
revoke all on function public.send_feedback(text, uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.admin_feedback(date, uuid, integer) from public, anon, authenticated;
revoke all on function public.admin_delete_feedback(uuid) from public, anon, authenticated;
revoke all on function public.admin_survey_summary() from public, anon, authenticated;
revoke all on function public.admin_survey_answers(text, date, uuid, integer)
  from public, anon, authenticated;

-- Los checks de las tablas las evalúan con el rol de quien escribe, que siempre es una de estas
-- funciones `security definer`.
grant execute on function public.survey_for(text, uuid) to authenticated;
grant execute on function public.my_pets_survey() to authenticated;
grant execute on function public.answer_survey(uuid, text, text) to authenticated;
grant execute on function public.dismiss_survey(uuid) to authenticated;
grant execute on function public.send_feedback(text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.admin_feedback(date, uuid, integer) to authenticated;
grant execute on function public.admin_delete_feedback(uuid) to authenticated;
grant execute on function public.admin_survey_summary() to authenticated;
grant execute on function public.admin_survey_answers(text, date, uuid, integer) to authenticated;
