-- Responder las solicitudes de un animal (historia #65). `applications.status` suma `accepted` y
-- `rejected` (research R1); lo que es solo del publicador vive en tablas sin permisos que leen
-- funciones `security definer` (R2); los correos salen de una bandeja de salida que escribe la base
-- en la misma transacción que el cambio (R3); el contacto se lee del teléfono de hoy (R4).

-- ---------------------------------------------------------------------------------------------
-- Las reglas, con paridad en lib/applications/
-- ---------------------------------------------------------------------------------------------

create or replace function private.max_questions()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 3;
$$;

create or replace function private.question_max_length()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 500;
$$;

create or replace function private.rejection_note_max_length()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 200;
$$;

-- Los motivos de FR-020 en orden; `not_concluded` solo existe al dejar sin efecto (FR-024). Un test
-- los compara con `REJECTION_REASONS`.
create or replace function private.rejection_reasons()
returns table (id text)
language sql
immutable
set search_path = ''
as $$
  values ('chose_other'), ('housing'), ('alone_too_long'), ('no_neuter_commitment'),
         ('household_fit'), ('no_answer'), ('other');
$$;

-- Un texto libre de 1 a `p_max` caracteres que no sea solo espacios (FR-034).
create or replace function private.free_text_valid(p_text text, p_max integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_text is not null
     and char_length(p_text) between 1 and p_max
     and p_text ~ '[^[:space:]]';
$$;

-- ---------------------------------------------------------------------------------------------
-- Los estados nuevos
-- ---------------------------------------------------------------------------------------------

alter table public.applications drop constraint applications_status_valid;
alter table public.applications add constraint applications_status_valid
  check (status in ('sent', 'accepted', 'rejected', 'withdrawn', 'closed'));

comment on column public.applications.status is
  'Activa = `sent` (esperando respuesta) o `accepted`. `rejected` también es la aceptación dejada '
  'sin efecto. Retirada, rechazada y cerrada son finales (historia #65, research R1).';

drop index public.applications_one_active_idx;
drop index public.applications_pet_active_idx;
drop index public.applications_publisher_active_idx;

create unique index applications_one_active_idx on public.applications (applicant_id, pet_id)
  where status in ('sent', 'accepted');
create index applications_pet_active_idx on public.applications (pet_id)
  where status in ('sent', 'accepted');
create index applications_publisher_active_idx on public.applications (publisher_id)
  where status in ('sent', 'accepted');
create index applications_publisher_idx on public.applications (publisher_id, pet_id, sent_at);
create index applications_rejected_idx on public.applications (applicant_id, pet_id)
  where status = 'rejected';

-- Activa solo avanza: esperando → aceptada, rechazada, retirada o cerrada; aceptada → rechazada
-- (dejar sin efecto), retirada o cerrada. Las finales no cambian, salvo el bloqueo mutuo de #63.
create or replace function private.applications_forward_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('sent', 'accepted') then
    if old.status = 'accepted' and new.status = 'sent' then
      raise exception using errcode = 'P0001', message = 'application_final';
    end if;
    return new;
  end if;
  if (new.status is distinct from old.status
      or new.close_reason is distinct from old.close_reason)
     and not (old.close_reason = 'not_receiving'
              and new.status = 'closed'
              and new.close_reason = 'you_blocked') then
    raise exception using errcode = 'P0001', message = 'application_final';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Lo que es solo del publicador, las preguntas, la bandeja de salida y las visitas
-- ---------------------------------------------------------------------------------------------


-- Un motivo de la lista; `not_concluded` solo cuando hubo una aceptación (FR-024).
create or replace function private.rejection_reason_valid(p_reason text, p_was_accepted boolean)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_reason in (select r.id from private.rejection_reasons() r)
      or (p_reason = 'not_concluded' and p_was_accepted);
$$;

-- Una fila por solicitud, creada al abrirla o en la primera respuesta. Sin políticas y sin permisos:
-- `applications_select_own` deja a quien solicitó leer su fila entera, y el motivo del rechazo no
-- puede estar ahí (FR-021, R2).
create table public.application_reviews (
  application_id uuid primary key references public.applications (id) on delete cascade,
  opened_at timestamptz,
  first_response_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  rejection_note text,

  constraint application_reviews_rejection_pair check ((rejected_at is null) = (rejection_reason is null)),
  constraint application_reviews_reason_valid check (
    rejection_reason is null or private.rejection_reason_valid(rejection_reason, accepted_at is not null)
  ),
  constraint application_reviews_note_with_other check (
    (rejection_reason is not distinct from 'other') = (rejection_note is not null)
  ),
  constraint application_reviews_note_valid check (
    rejection_note is null or private.free_text_valid(rejection_note, private.rejection_note_max_length())
  )
);

comment on table public.application_reviews is
  'Lo que es solo del publicador (historia #65, R2): si la abrió, cuándo respondió y el motivo del '
  'rechazo. Se lee solo con funciones que eligen columnas según quién mira.';

alter table public.application_reviews enable row level security;
revoke all on public.application_reviews from anon, authenticated;

create table public.application_questions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  position smallint not null,
  attempt_id uuid not null,
  question text not null,
  asked_at timestamptz not null default now(),
  answer text,
  answered_at timestamptz,

  constraint application_questions_position_unique unique (application_id, position),
  constraint application_questions_attempt_unique unique (application_id, attempt_id),
  constraint application_questions_position_valid check (
    position between 1 and private.max_questions()
  ),
  constraint application_questions_question_valid check (
    private.free_text_valid(question, private.question_max_length())
  ),
  constraint application_questions_answer_valid check (
    answer is null or private.free_text_valid(answer, private.question_max_length())
  ),
  constraint application_questions_answer_pair check ((answer is null) = (answered_at is null))
);

comment on table public.application_questions is
  'Lo que el publicador pregunta antes de decidir (FR-030): hasta 3, una pendiente a la vez. Lo leen '
  'solo las dos personas, por funciones (FR-033).';

create unique index application_questions_one_pending on public.application_questions (application_id)
  where answer is null;

alter table public.application_questions enable row level security;
revoke all on public.application_questions from anon, authenticated;

-- La bandeja de salida (R3): la escriben las respuestas y los cierres en la misma transacción que el
-- cambio, y la vacía `claim_application_notices`. Retirar, bloquear y suspender no escriben (FR-062).
create table public.application_notices (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  application_id uuid not null references public.applications (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint application_notices_kind_valid check (
    kind in (
      'new_application', 'question_answered', 'accepted', 'rejected', 'question_asked',
      'closed_adopted', 'closed_unpublished'
    )
  )
);

create index application_notices_created_idx on public.application_notices (created_at);
create index application_notices_application_idx on public.application_notices (application_id);
create index application_notices_recipient_idx on public.application_notices (recipient_id);

alter table public.application_notices enable row level security;
revoke all on public.application_notices from anon, authenticated;

-- La última vez que el publicador abrió las solicitudes de cada animal (R6): decide si sale el correo
-- de una solicitud nueva.
create table public.inbox_visits (
  publisher_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (publisher_id, pet_id)
);

create index inbox_visits_pet_idx on public.inbox_visits (pet_id);

alter table public.inbox_visits enable row level security;
revoke all on public.inbox_visits from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Ayudas
-- ---------------------------------------------------------------------------------------------

-- El nivel de una persona como lo dice su chapita: 0 sin teléfono verificado hoy.
create or replace function private.person_level(p_user uuid)
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when public.identity_level_one(p_user, private.pending_ttl())
             then private.publisher_level(p_user)
           else 0::smallint
         end;
$$;

-- Por qué se cerró, del lado del publicador (FR-042): retirada, el bloqueo de quien solicitó o su
-- suspensión son el mismo `gone`; `you_blocked` si hoy el publicador bloquea a quien solicitó.
create or replace function private.publisher_close(p_app public.applications)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when p_app.status = 'withdrawn' then 'gone'
           when p_app.status <> 'closed' then null
           when p_app.close_reason in ('adopted', 'unpublished') then p_app.close_reason
           when p_app.close_reason in ('not_receiving', 'you_blocked') and exists (
             select 1
               from public.blocks b
              where b.blocker_id = p_app.publisher_id
                and b.blocked_id = p_app.applicant_id
           ) then 'you_blocked'
           else 'gone'
         end;
$$;

-- Lo que una respuesta del publicador sobre una que ya no espera devuelve (FR-044): `gone` y
-- `you_blocked` del lado del publicador; las demás cerradas, `closed` con su motivo.
create or replace function private.not_answerable(p_app public.applications)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case private.publisher_close(p_app)
           when 'gone' then 'gone'
           when 'you_blocked' then 'you_blocked'
           else 'closed'
         end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Lo de #63 que contaba activas: ahora cuenta `sent` y `accepted` (R1)
-- ---------------------------------------------------------------------------------------------

drop function public.pet_application_view(text);

-- Suma `my_rejected`: quien fue rechazado no vuelve a solicitar ese animal (R7, FR-023).
create or replace function public.pet_application_view(p_code text)
returns table (required_level smallint, receives boolean, my_active_id uuid, my_rejected boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.required_level,
         private.pet_receives_applications(p) = 'yes',
         (
           select a.id
             from public.applications a
            where a.applicant_id = (select auth.uid())
              and a.pet_id = p.id
              and a.status in ('sent', 'accepted')
         ),
         exists (
           select 1
             from public.applications a
            where a.applicant_id = (select auth.uid())
              and a.pet_id = p.id
              and a.status = 'rejected'
         )
    from public.pets p
   where p.code = p_code;
$$;

drop function public.apply_context(uuid, text, interval);

create or replace function public.apply_context(
  p_applicant uuid,
  p_code text,
  p_pending_ttl interval
)
returns table (
  is_owner boolean,
  receiving text,
  state text,
  is_neutered boolean,
  required_level smallint,
  code text,
  name text,
  publisher_name text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  blocked_by_publisher boolean,
  blocked_publisher boolean,
  my_active_id uuid,
  my_rejected boolean,
  active_count integer,
  level_one boolean,
  level_two boolean,
  level smallint,
  identity_pending_since timestamptz,
  last_answers jsonb,
  active jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.owner_id = p_applicant,
         private.pet_receives_applications(p),
         private.pet_state(p.status, p.expires_at, p.taken_down_at),
         p.is_neutered,
         p.required_level,
         p.code,
         p.name,
         pr.display_name,
         ph.id, ph.owner_id, ph.width, ph.height, ph.thumbhash,
         exists (
           select 1 from public.blocks b where b.blocker_id = p.owner_id and b.blocked_id = p_applicant
         ),
         exists (
           select 1 from public.blocks b where b.blocker_id = p_applicant and b.blocked_id = p.owner_id
         ),
         (
           select a.id
             from public.applications a
            where a.applicant_id = p_applicant
              and a.pet_id = p.id
              and a.status in ('sent', 'accepted')
         ),
         exists (
           select 1
             from public.applications a
            where a.applicant_id = p_applicant
              and a.pet_id = p.id
              and a.status = 'rejected'
         ),
         (
           select count(*)::integer
             from public.applications a
            where a.applicant_id = p_applicant
              and a.status in ('sent', 'accepted')
         ),
         l.level_one,
         private.has_level_two(p_applicant, p_pending_ttl),
         case when l.level_one then private.publisher_level(p_applicant) else 0::smallint end,
         (
           select r.sent_at
             from public.identity_requests r
            where r.user_id = p_applicant
              and r.expires_at > now()
         ),
         (
           select a.answers
             from public.applications a
            where a.applicant_id = p_applicant
            order by a.sent_at desc
            limit 1
         ),
         coalesce(
           (
             select jsonb_agg(
                      jsonb_build_object(
                        'id', a.id,
                        'sent_at', a.sent_at,
                        'code', v.code,
                        'name', coalesce(v.name, a.pet_name),
                        'cover_id', v.cover_id,
                        'cover_owner', v.cover_owner,
                        'cover_width', v.cover_width,
                        'cover_height', v.cover_height,
                        'cover_thumbhash', v.cover_thumbhash
                      )
                      order by a.sent_at desc
                    )
               from public.applications a
               left join lateral private.application_pet(a.pet_id, p_applicant) v on true
              where a.applicant_id = p_applicant
                and a.status in ('sent', 'accepted')
           ),
           '[]'::jsonb
         )
    from public.pets p
    cross join lateral (
      select public.identity_level_one(p_applicant, p_pending_ttl) as level_one
    ) l
    left join public.profiles pr on pr.id = p.owner_id
    left join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
   where p.code = p_code;
$$;

drop function public.my_applications();

-- Suma si fue aceptada alguna vez (el contacto de una cerrada por adopción) y si le preguntaron algo
-- que todavía no contestó. Nunca el motivo del rechazo ni si el publicador la abrió (R2).
create or replace function public.my_applications()
returns table (
  id uuid,
  status text,
  close_reason text,
  sent_at timestamptz,
  changed_at timestamptz,
  code text,
  pet_name text,
  pet_on_view boolean,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  was_accepted boolean,
  waiting_question boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.status, a.close_reason, a.sent_at, a.changed_at,
         v.code,
         coalesce(v.name, a.pet_name),
         coalesce(v.on_view, false),
         v.cover_id, v.cover_owner, v.cover_width, v.cover_height, v.cover_thumbhash,
         coalesce(r.accepted_at is not null, false),
         a.status in ('sent', 'accepted') and exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         )
    from public.applications a
    left join lateral private.application_pet(a.pet_id, a.applicant_id) v on true
    left join public.application_reviews r on r.application_id = a.id
   where a.applicant_id = (select auth.uid())
   order by a.status in ('sent', 'accepted') desc, a.sent_at desc, a.id;
$$;

drop function public.my_application(uuid);

create or replace function public.my_application(p_id uuid)
returns table (
  id uuid,
  status text,
  close_reason text,
  sent_at timestamptz,
  changed_at timestamptz,
  code text,
  pet_name text,
  pet_on_view boolean,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  publisher_name text,
  answers jsonb,
  was_accepted boolean,
  waiting_question boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.status, a.close_reason, a.sent_at, a.changed_at,
         v.code,
         coalesce(v.name, a.pet_name),
         coalesce(v.on_view, false),
         v.cover_id, v.cover_owner, v.cover_width, v.cover_height, v.cover_thumbhash,
         v.publisher_name,
         a.answers,
         coalesce(r.accepted_at is not null, false),
         a.status in ('sent', 'accepted') and exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         )
    from public.applications a
    left join lateral private.application_pet(a.pet_id, a.applicant_id) v on true
    left join public.application_reviews r on r.application_id = a.id
   where a.id = p_id
     and a.applicant_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------------------------
-- Enviar y retirar
-- ---------------------------------------------------------------------------------------------

-- La de #63, con tres cambios: la activa y el límite cuentan las aceptadas; `rejected` si ya fue
-- rechazada por ese animal (R7), después de `has_active` y antes del límite; y el correo de solicitud
-- nueva, salvo que el animal ya tenga otra nueva llegada después de la última visita (R6, FR-060).
create or replace function public.submit_application(
  p_applicant uuid,
  p_attempt uuid,
  p_code text,
  p_answers jsonb,
  p_pending_ttl interval
)
returns table (outcome text, application_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_pet public.pets%rowtype;
  v_receiving text;
begin
  perform public.lock_phone_account(p_applicant);

  select a.id into v_id
    from public.applications a
   where a.applicant_id = p_applicant
     and a.attempt_id = p_attempt;
  if v_id is not null then
    return query select 'already', v_id;
    return;
  end if;

  select * into v_pet from public.pets p where p.code = p_code;
  if not found then
    return query select 'not_found', null::uuid;
    return;
  end if;
  if v_pet.owner_id = p_applicant then
    return query select 'own', null::uuid;
    return;
  end if;
  if exists (
    select 1 from public.blocks b where b.blocker_id = p_applicant and b.blocked_id = v_pet.owner_id
  ) then
    return query select 'you_blocked', null::uuid;
    return;
  end if;

  v_receiving := private.pet_receives_applications(v_pet);
  if v_receiving = 'unavailable' then
    return query select 'unavailable', null::uuid;
    return;
  end if;
  if v_receiving = 'closed' or exists (
    select 1 from public.blocks b where b.blocker_id = v_pet.owner_id and b.blocked_id = p_applicant
  ) then
    return query select 'not_receiving', null::uuid;
    return;
  end if;

  select a.id into v_id
    from public.applications a
   where a.applicant_id = p_applicant
     and a.pet_id = v_pet.id
     and a.status in ('sent', 'accepted');
  if v_id is not null then
    return query select 'has_active', v_id;
    return;
  end if;

  if exists (
    select 1
      from public.applications a
     where a.applicant_id = p_applicant
       and a.pet_id = v_pet.id
       and a.status = 'rejected'
  ) then
    return query select 'rejected', null::uuid;
    return;
  end if;

  if (
    select count(*)
      from public.applications a
     where a.applicant_id = p_applicant
       and a.status in ('sent', 'accepted')
  ) >= private.max_active_applications() then
    return query select 'limit', null::uuid;
    return;
  end if;

  if not public.identity_level_one(p_applicant, p_pending_ttl) then
    return query select 'needs_phone', null::uuid;
    return;
  end if;
  if v_pet.required_level = 2 and not private.has_level_two(p_applicant, p_pending_ttl) then
    return query select 'needs_identity', null::uuid;
    return;
  end if;

  if not private.application_answers_valid(p_answers, v_pet.is_neutered) then
    return query select 'answers_invalid', null::uuid;
    return;
  end if;

  insert into public.applications (applicant_id, pet_id, publisher_id, attempt_id, answers, pet_name)
  values (p_applicant, v_pet.id, v_pet.owner_id, p_attempt, p_answers, v_pet.name)
  returning id into v_id;

  if not exists (
    select 1
      from public.applications a
      left join public.application_reviews r on r.application_id = a.id
     where a.pet_id = v_pet.id
       and a.id <> v_id
       and a.status = 'sent'
       and r.opened_at is null
       and a.sent_at > coalesce(
         (
           select iv.seen_at
             from public.inbox_visits iv
            where iv.publisher_id = v_pet.owner_id
              and iv.pet_id = v_pet.id
         ),
         '-infinity'::timestamptz
       )
  ) then
    insert into public.application_notices (kind, application_id, recipient_id)
    values ('new_application', v_id, v_pet.owner_id);
  end if;

  return query select 'sent', v_id;
end;
$$;

-- La de #63: retira también una aceptada (FR-052) y no escribe ningún correo (FR-062). Una
-- rechazada ya no se retira.
create or replace function public.withdraw_application(p_applicant uuid, p_id uuid)
returns table (outcome text, close_reason text, sent_at timestamptz, code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.applications%rowtype;
begin
  perform public.lock_phone_account(p_applicant);

  select * into v_app
    from public.applications a
   where a.id = p_id
     and a.applicant_id = p_applicant
     for update;
  if not found then
    return query select 'not_found', null::text, null::timestamptz, null::text;
    return;
  end if;
  if v_app.status = 'withdrawn' then
    return query select 'already_withdrawn', null::text, null::timestamptz, null::text;
    return;
  end if;
  if v_app.status = 'rejected' then
    return query select 'rejected', null::text, null::timestamptz, null::text;
    return;
  end if;
  if v_app.status = 'closed' then
    return query select 'closed', v_app.close_reason, null::timestamptz, null::text;
    return;
  end if;

  update public.applications a
     set status = 'withdrawn',
         changed_at = now()
   where a.id = v_app.id;

  return query
    select 'withdrawn', null::text, v_app.sent_at,
           (select p.code from public.pets p where p.id = v_app.pet_id);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Los cierres de #63, sobre las activas; los del animal escriben su correo (FR-061, FR-062)
-- ---------------------------------------------------------------------------------------------

create or replace function private.applications_close_on_pet_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text;
begin
  v_reason := case
                when new.taken_down_at is not null and old.taken_down_at is null then 'unpublished'
                when new.status = 'adopted' and old.status <> 'adopted' then 'adopted'
              end;
  if v_reason is not null then
    with closed as (
      update public.applications a
         set status = 'closed', close_reason = v_reason, changed_at = now(), pet_name = new.name
       where a.pet_id = new.id
         and a.status in ('sent', 'accepted')
      returning a.id, a.applicant_id
    )
    insert into public.application_notices (kind, application_id, recipient_id)
    select case v_reason when 'adopted' then 'closed_adopted' else 'closed_unpublished' end,
           c.id, c.applicant_id
      from closed c;
  end if;
  return null;
end;
$$;

create or replace function private.applications_close_on_pet_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  with closed as (
    update public.applications a
       set status = 'closed', close_reason = 'unpublished', changed_at = now(), pet_name = old.name
     where a.pet_id = old.id
       and a.status in ('sent', 'accepted')
    returning a.id, a.applicant_id
  )
  insert into public.application_notices (kind, application_id, recipient_id)
  select 'closed_unpublished', c.id, c.applicant_id
    from closed c;
  return old;
end;
$$;

create or replace function private.applications_close_on_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.applications a
     set status = 'closed',
         close_reason = 'not_receiving',
         changed_at = now(),
         pet_name = coalesce((select p.name from public.pets p where p.id = a.pet_id), a.pet_name)
   where a.applicant_id = new.blocked_id
     and a.publisher_id = new.blocker_id
     and a.status in ('sent', 'accepted');

  update public.applications a
     set status = 'closed',
         close_reason = 'you_blocked',
         changed_at = now(),
         pet_name = coalesce((select p.name from public.pets p where p.id = a.pet_id), a.pet_name)
   where a.applicant_id = new.blocker_id
     and a.publisher_id = new.blocked_id
     and a.status in ('sent', 'accepted');

  update public.applications a
     set close_reason = 'you_blocked'
   where a.applicant_id = new.blocker_id
     and a.publisher_id = new.blocked_id
     and a.status = 'closed'
     and a.close_reason = 'not_receiving';
  return null;
end;
$$;

create or replace function private.applications_close_on_suspension()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.applications a
     set status = 'closed',
         close_reason = 'suspended',
         changed_at = now(),
         pet_name = coalesce((select p.name from public.pets p where p.id = a.pet_id), a.pet_name)
   where a.applicant_id = new.user_id
     and a.status in ('sent', 'accepted');

  update public.applications a
     set status = 'closed',
         close_reason = 'unpublished',
         changed_at = now(),
         pet_name = coalesce((select p.name from public.pets p where p.id = a.pet_id), a.pet_name)
   where a.publisher_id = new.user_id
     and a.status in ('sent', 'accepted');
  return null;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Las lecturas del publicador (US1): con su sesión; lo ajeno, cero filas (FR-001)
-- ---------------------------------------------------------------------------------------------

-- Solicitudes: sus animales no borrados ni dados de baja con al menos una solicitud (FR-002). Sin
-- datos de nadie: los conteos y la portada. El orden lo da `inboxOrder`.
create or replace function public.publisher_inbox()
returns table (
  pet_id uuid,
  code text,
  name text,
  sex text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  waiting_count integer,
  new_count integer,
  last_sent_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.code, p.name, p.sex,
         ph.id, ph.owner_id, ph.width, ph.height, ph.thumbhash,
         count(*) filter (where a.status = 'sent')::integer,
         count(*) filter (where a.status = 'sent' and r.opened_at is null)::integer,
         max(a.sent_at)
    from public.pets p
    join public.applications a on a.pet_id = p.id
    left join public.application_reviews r on r.application_id = a.id
    left join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
   where p.owner_id = (select auth.uid())
     and p.taken_down_at is null
   group by p.id, ph.id;
$$;

-- Cuántas nuevas tiene cada animal suyo, para Mis animales (FR-006).
create or replace function public.publisher_new_counts()
returns table (pet_id uuid, new_count integer, total_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select a.pet_id,
         count(*) filter (where a.status = 'sent' and r.opened_at is null)::integer,
         count(*)::integer
    from public.applications a
    join public.pets p on p.id = a.pet_id
    left join public.application_reviews r on r.application_id = a.id
   where p.owner_id = (select auth.uid())
   group by a.pet_id;
$$;

-- El animal de «Solicitudes por Tobi», también sin ninguna: suyo, no dado de baja.
create or replace function public.inbox_pet(p_pet uuid)
returns table (
  pet_id uuid,
  code text,
  name text,
  sex text,
  state text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.code, p.name, p.sex,
         private.pet_state(p.status, p.expires_at, p.taken_down_at),
         ph.id, ph.owner_id, ph.width, ph.height, ph.thumbhash
    from public.pets p
    left join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
   where p.id = p_pet
     and p.owner_id = (select auth.uid())
     and p.taken_down_at is null;
$$;

-- Las de un animal suyo (FR-003, FR-004): quién, su nivel de hoy y tres respuestas para comparar.
-- Sin contacto. El orden lo da `petApplicationsOrder`.
create or replace function public.pet_applications(p_pet uuid)
returns table (
  id uuid,
  status text,
  publisher_close text,
  sent_at timestamptz,
  changed_at timestamptz,
  is_new boolean,
  waiting_question boolean,
  applicant_public_id text,
  applicant_name text,
  applicant_avatar_path text,
  applicant_department text,
  applicant_locality text,
  applicant_level smallint,
  housing_type text,
  outdoor_space text,
  hours_alone text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.status, private.publisher_close(a), a.sent_at, a.changed_at,
         a.status = 'sent' and r.opened_at is null,
         exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         ),
         pr.public_id, pr.display_name, pr.avatar_path, pr.department, pr.locality,
         private.person_level(a.applicant_id),
         a.answers ->> 'housing_type',
         a.answers ->> 'outdoor_space',
         a.answers ->> 'hours_alone'
    from public.applications a
    join public.pets p on p.id = a.pet_id
    left join public.application_reviews r on r.application_id = a.id
    left join public.profiles pr on pr.id = a.applicant_id
   where a.pet_id = p_pet
     and p.owner_id = (select auth.uid())
     and p.taken_down_at is null;
$$;

-- Una, si es de un animal que quien mira publicó (FR-001). De un animal borrado o dado de baja, sin
-- quien la mandó ni sus respuestas (FR-043). `publisher_close` y no el motivo de #63 (FR-042).
create or replace function public.publisher_application(p_id uuid)
returns table (
  id uuid,
  status text,
  publisher_close text,
  sent_at timestamptz,
  changed_at timestamptz,
  pet_id uuid,
  pet_code text,
  pet_name text,
  pet_sex text,
  pet_state text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  applicant_public_id text,
  applicant_name text,
  applicant_avatar_path text,
  applicant_department text,
  applicant_locality text,
  applicant_level smallint,
  answers jsonb,
  opened_at timestamptz,
  accepted_at timestamptz,
  rejection_reason text,
  rejection_note text,
  applicant_has_phone boolean,
  publisher_has_phone boolean,
  questions_asked integer,
  question_pending boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.status, private.publisher_close(a), a.sent_at, a.changed_at,
         case when g.shows then p.id end,
         case when g.shows then p.code end,
         coalesce(case when g.shows then p.name end, a.pet_name),
         p.sex,
         case when g.shows then private.pet_state(p.status, p.expires_at, p.taken_down_at) end,
         case when g.shows then ph.id end,
         case when g.shows then ph.owner_id end,
         case when g.shows then ph.width end,
         case when g.shows then ph.height end,
         case when g.shows then ph.thumbhash end,
         case when g.shows then pr.public_id end,
         case when g.shows then pr.display_name end,
         case when g.shows then pr.avatar_path end,
         case when g.shows then pr.department end,
         case when g.shows then pr.locality end,
         case when g.shows then private.person_level(a.applicant_id) end,
         case when g.shows then a.answers end,
         r.opened_at, r.accepted_at, r.rejection_reason, r.rejection_note,
         public.identity_level_one(a.applicant_id, private.pending_ttl()),
         public.identity_level_one(a.publisher_id, private.pending_ttl()),
         (select count(*)::integer from public.application_questions q where q.application_id = a.id),
         exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         )
    from public.applications a
    left join public.pets p on p.id = a.pet_id
    cross join lateral (select p.id is not null and p.taken_down_at is null as shows) g
    left join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
    left join public.profiles pr on pr.id = a.applicant_id
    left join public.application_reviews r on r.application_id = a.id
   where a.id = p_id
     and a.publisher_id = (select auth.uid());
$$;

-- El contacto de la otra persona (R4, FR-018): solo a una de las dos, con la solicitud aceptada o
-- cerrada por adopción estando aceptada. El nombre de hoy y el teléfono verificado de hoy, con la
-- regla del nivel 1: con un cambio a medias o sin número, `phone` nulo (FR-013). Nunca el correo.
-- `side` es quién mira; `viewer_name` y `pet_name` arman el mensaje de WhatsApp.
create or replace function public.application_contact(p_id uuid)
returns table (name text, phone text, side text, viewer_name text, pet_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.display_name,
         case
           when public.identity_level_one(o.other_id, private.pending_ttl()) then ph.verified_number
         end,
         o.side,
         me.display_name,
         coalesce(p.name, a.pet_name)
    from public.applications a
    join public.application_reviews r on r.application_id = a.id
    cross join lateral (
      select case
               when a.applicant_id = (select auth.uid()) then a.publisher_id
               when a.publisher_id = (select auth.uid()) then a.applicant_id
             end as other_id,
             case
               when a.applicant_id = (select auth.uid()) then 'applicant'
               else 'publisher'
             end as side
    ) o
    join public.profiles pr on pr.id = o.other_id
    left join public.profiles me on me.id = (select auth.uid())
    left join public.phones ph on ph.user_id = o.other_id
    left join public.pets p on p.id = a.pet_id
   where a.id = p_id
     and r.accepted_at is not null
     and (a.status = 'accepted' or (a.status = 'closed' and a.close_reason = 'adopted'));
$$;

-- ---------------------------------------------------------------------------------------------
-- Las escrituras del publicador (US1): con el servicio y su id, que sale de la sesión
-- ---------------------------------------------------------------------------------------------

-- Abrir la deja de marcar como nueva para siempre (FR-005). `opened_first` solo la primera vez,
-- para medir las horas hasta abrirla.
create or replace function public.open_application(p_publisher uuid, p_id uuid)
returns table (opened_first boolean, sent_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sent timestamptz;
  v_first boolean;
begin
  select a.sent_at into v_sent
    from public.applications a
   where a.id = p_id
     and a.publisher_id = p_publisher;
  if not found then
    return;
  end if;

  insert into public.application_reviews as r (application_id, opened_at)
  values (p_id, now())
  on conflict (application_id) do update
    set opened_at = now()
    where r.opened_at is null
  returning true into v_first;

  return query select coalesce(v_first, false), v_sent;
end;
$$;

-- Abrir Solicitudes (todos sus animales con solicitudes) o las de un animal vuelve a habilitar el
-- correo de la próxima nueva de cada uno (R6).
create or replace function public.visit_inbox(p_publisher uuid, p_pet uuid default null)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.inbox_visits as v (publisher_id, pet_id, seen_at)
  select p_publisher, p.id, now()
    from public.pets p
   where p.owner_id = p_publisher
     and (p_pet is null or p.id = p_pet)
     and exists (select 1 from public.applications a where a.pet_id = p.id)
  on conflict (publisher_id, pet_id) do update set seen_at = excluded.seen_at;
$$;

-- Aceptar (R5) con el candado de la solicitud: dos pestañas o un retiro al mismo tiempo se ordenan.
--   accepted               quedó aceptada; `first_response` si fue la primera respuesta
--   already_accepted       ya lo estaba (doble toque)
--   rejected               ya estaba rechazada
--   gone · you_blocked     cerrada o retirada, del lado del publicador (FR-042)
--   closed                 cerrada por el animal, con el motivo
--   publisher_needs_phone  el publicador no tiene hoy nivel 1 (FR-011)
--   applicant_needs_phone  quien solicitó no lo tiene
--   not_found              no existe o no es de un animal suyo
create or replace function public.accept_application(p_publisher uuid, p_id uuid)
returns table (outcome text, first_response boolean, sent_at timestamptz, close_reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.applications%rowtype;
  v_first boolean;
begin
  select * into v_app
    from public.applications a
   where a.id = p_id
     and a.publisher_id = p_publisher
     for update;
  if not found then
    return query select 'not_found', false, null::timestamptz, null::text;
    return;
  end if;
  if v_app.status = 'accepted' then
    return query select 'already_accepted', false, v_app.sent_at, null::text;
    return;
  end if;
  if v_app.status = 'rejected' then
    return query select 'rejected', false, v_app.sent_at, null::text;
    return;
  end if;
  if v_app.status <> 'sent' then
    return query select private.not_answerable(v_app), false, v_app.sent_at, v_app.close_reason;
    return;
  end if;
  if not public.identity_level_one(p_publisher, private.pending_ttl()) then
    return query select 'publisher_needs_phone', false, v_app.sent_at, null::text;
    return;
  end if;
  if not public.identity_level_one(v_app.applicant_id, private.pending_ttl()) then
    return query select 'applicant_needs_phone', false, v_app.sent_at, null::text;
    return;
  end if;

  update public.applications a
     set status = 'accepted', changed_at = now()
   where a.id = p_id;

  v_first := not exists (
    select 1
      from public.application_reviews r
     where r.application_id = p_id
       and r.first_response_at is not null
  );
  insert into public.application_reviews as r (application_id, accepted_at, first_response_at)
  values (p_id, now(), now())
  on conflict (application_id) do update
    set accepted_at = now(),
        first_response_at = coalesce(r.first_response_at, now());

  insert into public.application_notices (kind, application_id, recipient_id)
  values ('accepted', p_id, v_app.applicant_id);

  return query select 'accepted', v_first, v_app.sent_at, null::text;
end;
$$;

-- Guardar el rechazo en la fila del publicador y avisar a quien solicitó (FR-021, FR-061). Lo comparten
-- rechazar y dejar sin efecto, que ya tomaron el candado y controlaron el estado.
create or replace function private.record_rejection(
  p_app public.applications,
  p_reason text,
  p_note text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first boolean;
begin
  update public.applications a
     set status = 'rejected', changed_at = now()
   where a.id = p_app.id;

  v_first := not exists (
    select 1
      from public.application_reviews r
     where r.application_id = p_app.id
       and r.first_response_at is not null
  );
  -- Primero la fila que ya existe: un `insert … on conflict` valida los checks sobre la fila nueva,
  -- sin el `accepted_at` que `not_concluded` necesita.
  update public.application_reviews r
     set rejected_at = now(),
         rejection_reason = p_reason,
         rejection_note = p_note,
         first_response_at = coalesce(r.first_response_at, now())
   where r.application_id = p_app.id;
  if not found then
    insert into public.application_reviews (
      application_id, rejected_at, rejection_reason, rejection_note, first_response_at
    )
    values (p_app.id, now(), p_reason, p_note, now());
  end if;

  insert into public.application_notices (kind, application_id, recipient_id)
  values ('rejected', p_app.id, p_app.applicant_id);

  return v_first;
end;
$$;

-- Si el motivo y la línea de «otro» se pueden guardar: la línea va solo con «otro» (FR-020).
create or replace function private.rejection_input_valid(
  p_reason text,
  p_note text,
  p_was_accepted boolean
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(private.rejection_reason_valid(p_reason, p_was_accepted), false)
     and case
           when p_reason = 'other'
             then private.free_text_valid(p_note, private.rejection_note_max_length())
           else p_note is null
         end;
$$;

-- Rechazar una que espera respuesta (R5, FR-020 a FR-023), con el candado de la solicitud.
--   rejected               quedó rechazada; `first_response` si fue la primera respuesta
--   already_rejected       ya lo estaba (doble toque): no vuelve a avisar
--   accepted               está aceptada: se deja sin efecto, no se rechaza
--   gone · you_blocked     cerrada o retirada, del lado del publicador (FR-042)
--   closed                 cerrada por el animal, con el motivo
--   invalid                el motivo no es de la lista, o la línea de «otro» falta o sobra
--   not_found              no existe o no es de un animal suyo
create or replace function public.reject_application(
  p_publisher uuid,
  p_id uuid,
  p_reason text,
  p_note text default null
)
returns table (outcome text, first_response boolean, sent_at timestamptz, close_reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.applications%rowtype;
begin
  select * into v_app
    from public.applications a
   where a.id = p_id
     and a.publisher_id = p_publisher
     for update;
  if not found then
    return query select 'not_found', false, null::timestamptz, null::text;
    return;
  end if;
  if v_app.status = 'rejected' then
    return query select 'already_rejected', false, v_app.sent_at, null::text;
    return;
  end if;
  if v_app.status = 'accepted' then
    return query select 'accepted', false, v_app.sent_at, null::text;
    return;
  end if;
  if v_app.status <> 'sent' then
    return query select private.not_answerable(v_app), false, v_app.sent_at, v_app.close_reason;
    return;
  end if;
  if not private.rejection_input_valid(p_reason, p_note, false) then
    return query select 'invalid', false, v_app.sent_at, null::text;
    return;
  end if;

  return query select 'rejected', private.record_rejection(v_app, p_reason, p_note), v_app.sent_at,
                      null::text;
end;
$$;

-- Dejar sin efecto una aceptada (FR-024): queda rechazada, el contacto deja de verse y quien
-- solicitó recibe el mismo correo de no aceptada. `not_concluded` solo existe acá.
--   rejected · already_rejected · not_accepted (espera respuesta: se rechaza, no se deja sin efecto)
--   gone · you_blocked · closed · invalid · not_found, como al rechazar
create or replace function public.revoke_acceptance(
  p_publisher uuid,
  p_id uuid,
  p_reason text,
  p_note text default null
)
returns table (outcome text, sent_at timestamptz, close_reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.applications%rowtype;
begin
  select * into v_app
    from public.applications a
   where a.id = p_id
     and a.publisher_id = p_publisher
     for update;
  if not found then
    return query select 'not_found', null::timestamptz, null::text;
    return;
  end if;
  if v_app.status = 'rejected' then
    return query select 'already_rejected', v_app.sent_at, null::text;
    return;
  end if;
  if v_app.status = 'sent' then
    return query select 'not_accepted', v_app.sent_at, null::text;
    return;
  end if;
  if v_app.status <> 'accepted' then
    return query select private.not_answerable(v_app), v_app.sent_at, v_app.close_reason;
    return;
  end if;
  if not private.rejection_input_valid(p_reason, p_note, true) then
    return query select 'invalid', v_app.sent_at, null::text;
    return;
  end if;

  perform private.record_rejection(v_app, p_reason, p_note);
  return query select 'rejected', v_app.sent_at, null::text;
end;
$$;

-- Vaciar la bandeja de salida (R3): `delete … returning` con `skip locked`, así dos vaciados a la vez
-- no mandan el mismo correo dos veces. Con el nombre del animal de ahora, o el que tenía.
create or replace function public.claim_application_notices(p_limit integer)
returns table (
  id uuid,
  kind text,
  application_id uuid,
  recipient_id uuid,
  pet_name text,
  pet_sex text
)
language sql
security definer
set search_path = ''
as $$
  with picked as (
    select n.id
      from public.application_notices n
     order by n.created_at
     limit p_limit
       for update skip locked
  ),
  claimed as (
    delete from public.application_notices n
     using picked
     where n.id = picked.id
    returning n.id, n.kind, n.application_id, n.recipient_id
  )
  select c.id, c.kind, c.application_id, c.recipient_id, coalesce(p.name, a.pet_name), p.sex
    from claimed c
    join public.applications a on a.id = c.application_id
    left join public.pets p on p.id = a.pet_id;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.person_level(uuid) from public, anon, authenticated;
revoke all on function private.publisher_close(public.applications) from public, anon, authenticated;
revoke all on function private.not_answerable(public.applications) from public, anon, authenticated;

revoke all on function public.pet_application_view(text) from public, anon, authenticated;
revoke all on function public.apply_context(uuid, text, interval) from public, anon, authenticated;
revoke all on function public.my_applications() from public, anon, authenticated;
revoke all on function public.my_application(uuid) from public, anon, authenticated;
revoke all on function public.publisher_inbox() from public, anon, authenticated;
revoke all on function public.publisher_new_counts() from public, anon, authenticated;
revoke all on function public.inbox_pet(uuid) from public, anon, authenticated;
revoke all on function public.pet_applications(uuid) from public, anon, authenticated;
revoke all on function public.publisher_application(uuid) from public, anon, authenticated;
revoke all on function public.application_contact(uuid) from public, anon, authenticated;
revoke all on function public.open_application(uuid, uuid) from public, anon, authenticated;
revoke all on function public.visit_inbox(uuid, uuid) from public, anon, authenticated;
revoke all on function public.accept_application(uuid, uuid) from public, anon, authenticated;
revoke all on function public.claim_application_notices(integer) from public, anon, authenticated;
revoke all on function private.record_rejection(public.applications, text, text)
  from public, anon, authenticated;
revoke all on function private.rejection_input_valid(text, text, boolean)
  from public, anon, authenticated;
revoke all on function public.reject_application(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.revoke_acceptance(uuid, uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.pet_application_view(text) to anon, authenticated;
grant execute on function public.apply_context(uuid, text, interval) to service_role;
grant execute on function public.my_applications() to authenticated;
grant execute on function public.my_application(uuid) to authenticated;
grant execute on function public.publisher_inbox() to authenticated;
grant execute on function public.publisher_new_counts() to authenticated;
grant execute on function public.inbox_pet(uuid) to authenticated;
grant execute on function public.pet_applications(uuid) to authenticated;
grant execute on function public.publisher_application(uuid) to authenticated;
grant execute on function public.application_contact(uuid) to authenticated;
grant execute on function public.open_application(uuid, uuid) to service_role;
grant execute on function public.visit_inbox(uuid, uuid) to service_role;
grant execute on function public.accept_application(uuid, uuid) to service_role;
grant execute on function public.claim_application_notices(integer) to service_role;
grant execute on function public.reject_application(uuid, uuid, text, text) to service_role;
grant execute on function public.revoke_acceptance(uuid, uuid, text, text) to service_role;
