-- Solicitar la adopción de un animal con el cuestionario (historia #63). Una tabla cerrada que lee
-- solo quien solicitó (research R1); enviar es una función `security definer` con el candado de la
-- cuenta, que controla en una sola transacción el límite, la unicidad, el nivel y el bloqueo (R2).
-- El cuestionario vive en `lib/applications/questionnaire.ts`; la base lo repite para validar, con
-- un test de paridad (R4).

-- ---------------------------------------------------------------------------------------------
-- El nivel exigido y el animal desde el que se pidió la identidad
-- ---------------------------------------------------------------------------------------------

-- Las publicaciones que ya existen piden teléfono verificado (FR-010).
alter table public.pets
  add column required_level smallint not null default 1,
  add constraint pets_required_level_valid check (required_level in (1, 2));

comment on column public.pets.required_level is
  'El nivel mínimo para solicitarlo: 1 teléfono verificado, 2 identidad verificada (historia #63). '
  'Cambiarlo no toca las solicitudes ya enviadas (FR-013).';

-- Se borra con el pedido y con la cuenta; si el animal se borra antes, el correo es el de siempre
-- (FR-012, research R10).
alter table public.identity_requests
  add column return_pet_id uuid references public.pets (id) on delete set null;

create index identity_requests_return_pet_idx on public.identity_requests (return_pet_id);

-- ---------------------------------------------------------------------------------------------
-- Las reglas, con paridad en lib/applications/
-- ---------------------------------------------------------------------------------------------

create or replace function private.max_active_applications()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 3;
$$;

create or replace function private.answer_max_length()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 500;
$$;

-- El cuestionario en el orden de FR-020: el id estable de cada pregunta, si es de opciones o de
-- texto, y sus opciones. Un test lo compara con `QUESTIONS`.
create or replace function private.application_questions()
returns table (id text, kind text, options text[])
language sql
immutable
set search_path = ''
as $$
  values
    ('housing_type', 'choice', array['house', 'apartment', 'other']),
    ('housing_tenure', 'choice', array['owned', 'rented', 'other']),
    ('rental_allows_pets', 'choice', array['yes', 'no', 'unsure']),
    ('outdoor_space', 'choice', array['yard', 'netted_balcony', 'open_balcony', 'none']),
    ('household', 'text', null::text[]),
    ('other_pets', 'text', null::text[]),
    ('hours_alone', 'choice', array['under_4', '4_to_8', 'over_8']),
    ('moving_plan', 'text', null::text[]),
    ('experience', 'text', null::text[]),
    ('neuter_commitment', 'choice', array['yes', 'no']),
    ('vet_budget', 'choice', array['yes', 'tight', 'no']),
    ('why_this_pet', 'text', null::text[]);
$$;

-- La forma mínima, para el `check` de la tabla: un objeto con claves conocidas y valores de texto.
-- La validación completa necesita saber si el animal está castrado, y eso no es de la fila.
create or replace function private.application_answers_shape(p_answers jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
           when jsonb_typeof(p_answers) <> 'object' then false
           else not exists (
             select 1
               from jsonb_each(p_answers) as e(key, value)
              where jsonb_typeof(e.value) <> 'string'
                 or e.key not in (select q.id from private.application_questions() q)
           )
         end;
$$;

-- La validación completa (R4): exactamente las preguntas que corresponden —el permiso del dueño solo
-- con vivienda alquilada, el compromiso de castración solo con un animal sin castrar—, opciones
-- conocidas, y textos de 1 a 500 caracteres que no sean solo espacios. El contacto lo detecta el
-- schema: dos copias de esa regla divergirían (R4, descartado).
create or replace function private.application_answers_valid(p_answers jsonb, p_pet_neutered boolean)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with expected as (
    select q.id, q.kind, q.options
      from private.application_questions() q
     where (q.id <> 'rental_allows_pets' or p_answers ->> 'housing_tenure' = 'rented')
       and (q.id <> 'neuter_commitment' or not p_pet_neutered)
  )
  select case
           when not private.application_answers_shape(p_answers) then false
           else (select count(*) from jsonb_object_keys(p_answers))
                  = (select count(*) from expected)
                and not exists (
                  select 1
                    from expected e
                   where not (p_answers ? e.id)
                      or (e.kind = 'choice' and not (p_answers ->> e.id = any (e.options)))
                      or (
                        e.kind = 'text'
                        and not (
                          char_length(p_answers ->> e.id) between 1 and private.answer_max_length()
                          and (p_answers ->> e.id) ~ '[^[:space:]]'
                        )
                      )
                )
         end;
$$;

-- Si el animal recibe solicitudes hoy, sin mirar bloqueos: `yes`; `unavailable`, que vuelve sola
-- (pausada, vencida, publicador sin nivel 1); o `closed`, que no (adoptada, dada de baja,
-- publicador suspendido). La comparten la ficha, la pantalla de «Quiero adoptar» y el envío.
create or replace function private.pet_receives_applications(p public.pets)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when private.pet_state(p.status, p.expires_at, p.taken_down_at) in ('adopted', 'taken_down')
             or private.is_suspended(p.owner_id) then 'closed'
           when private.pet_state(p.status, p.expires_at, p.taken_down_at) in ('paused', 'expired')
             or not public.identity_level_one(p.owner_id, private.pending_ttl()) then 'unavailable'
           else 'yes'
         end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Las solicitudes
-- ---------------------------------------------------------------------------------------------

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  publisher_id uuid references auth.users (id) on delete set null,
  attempt_id uuid not null,
  answers jsonb not null,
  pet_name text not null,
  status text not null default 'sent',
  close_reason text,
  sent_at timestamptz not null default now(),
  changed_at timestamptz not null default now(),

  constraint applications_attempt_unique unique (applicant_id, attempt_id),
  constraint applications_answers_shape check (private.application_answers_shape(answers)),
  constraint applications_status_valid check (status in ('sent', 'withdrawn', 'closed')),
  constraint applications_close_reason_valid check (
    close_reason in ('adopted', 'unpublished', 'not_receiving', 'you_blocked', 'suspended')
  ),
  constraint applications_close_reason_matches check ((status = 'closed') = (close_reason is not null))
);

comment on table public.applications is
  'Las solicitudes de adopción (historia #63). Las lee solo quien solicitó (FR-081, hasta la '
  'bandeja); se escriben solo con funciones de la base. `pet_id` nulo es un animal que se borró: la '
  'solicitud queda cerrada con el nombre que tenía (FR-082).';

comment on column public.applications.answers is
  'Un objeto { question_id: respuesta } con los ids estables de lib/applications/questionnaire.ts '
  '(docs/06 §Cuestionario): cambiar el texto de una pregunta no rompe lo enviado (FR-026).';

comment on column public.applications.publisher_id is
  'El dueño del animal al enviar: lo usan los cierres por bloqueo y suspensión y la bandeja.';

-- Una sola activa por animal, también si alguna vez se escribe por otro camino (R2).
create unique index applications_one_active_idx on public.applications (applicant_id, pet_id)
  where status = 'sent';
create index applications_applicant_idx on public.applications (applicant_id, sent_at desc);
create index applications_pet_active_idx on public.applications (pet_id) where status = 'sent';
create index applications_publisher_active_idx on public.applications (publisher_id)
  where status = 'sent';

alter table public.applications enable row level security;

-- Sin políticas de escritura, sin quien administra (FR-081) y sin `anon`.
create policy applications_select_own on public.applications
  for select to authenticated
  using (applicant_id = (select auth.uid()));

revoke all on public.applications from anon, authenticated;
grant select on public.applications to authenticated;

-- Retirada y cerrada no vuelven a estar activas, ni cambian de motivo (FR-052, FR-061).
create or replace function private.applications_forward_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'sent'
     and (new.status is distinct from old.status
          or new.close_reason is distinct from old.close_reason) then
    raise exception using errcode = 'P0001', message = 'application_final';
  end if;
  return new;
end;
$$;

create trigger applications_forward_only
  before update on public.applications
  for each row execute function private.applications_forward_only();

-- ---------------------------------------------------------------------------------------------
-- Lecturas
-- ---------------------------------------------------------------------------------------------

-- Lo que una solicitud muestra del animal (FR-065): el nombre de hoy, la foto y el enlace mientras
-- siga publicado y no sea de alguien que quien mira bloqueó; si no, nada, y la solicitud muestra el
-- nombre que guardó. `on_view` es si hoy cualquiera ve su ficha.
create or replace function private.application_pet(p_pet uuid, p_viewer uuid)
returns table (
  shows boolean,
  on_view boolean,
  code text,
  name text,
  publisher_name text,
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
  select v.shows,
         private.pet_is_shown(p),
         case when v.shows then p.code end,
         case when v.shows then p.name end,
         case when v.shows then pr.display_name end,
         case when v.shows then ph.id end,
         case when v.shows then ph.owner_id end,
         case when v.shows then ph.width end,
         case when v.shows then ph.height end,
         case when v.shows then ph.thumbhash end
    from public.pets p
    cross join lateral (
      select p.taken_down_at is null
         and not private.is_suspended(p.owner_id)
         and not exists (
           select 1
             from public.blocks b
            where b.blocker_id = p_viewer
              and b.blocked_id = p.owner_id
         ) as shows
    ) v
    left join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
    left join public.profiles pr on pr.id = p.owner_id
   where p.id = p_pet;
$$;

-- La ficha (R8): el nivel exigido, si recibe solicitudes en general y, con sesión, la solicitud
-- activa de quien mira. No mira bloqueos: la bloqueada ve «Quiero adoptar» como cualquiera (FR-001).
create or replace function public.pet_application_view(p_code text)
returns table (required_level smallint, receives boolean, my_active_id uuid)
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
              and a.status = 'sent'
         )
    from public.pets p
   where p.code = p_code;
$$;

-- Todo lo que necesita `applyGate` (R5), en una lectura. Cero filas si el animal no existe.
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
              and a.status = 'sent'
         ),
         (
           select count(*)::integer
             from public.applications a
            where a.applicant_id = p_applicant
              and a.status = 'sent'
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
                and a.status = 'sent'
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

-- Si un intento ya envió, su id (R7): una respuesta perdida y una recarga llevan a Mi solicitud.
create or replace function public.check_application_attempt(p_applicant uuid, p_attempt uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.id
    from public.applications a
   where a.applicant_id = p_applicant
     and a.attempt_id = p_attempt;
$$;

-- Las de quien tiene la sesión (R6): las activas primero y después las demás, cada grupo de la más
-- reciente a la más vieja (FR-071).
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
  cover_thumbhash text
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
         v.cover_id, v.cover_owner, v.cover_width, v.cover_height, v.cover_thumbhash
    from public.applications a
    left join lateral private.application_pet(a.pet_id, a.applicant_id) v on true
   where a.applicant_id = (select auth.uid())
   order by a.status = 'sent' desc, a.sent_at desc, a.id;
$$;

-- Una, con las respuestas, si es de quien tiene la sesión; si no, nada, igual que si no existiera
-- (FR-070).
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
  answers jsonb
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
         a.answers
    from public.applications a
    left join lateral private.application_pet(a.pet_id, a.applicant_id) v on true
   where a.id = p_id
     and a.applicant_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------------------------
-- Enviar
-- ---------------------------------------------------------------------------------------------

-- Con el candado de la cuenta, así dos pestañas o un doble toque se ordenan (R2). Los controles van
-- en el orden de FR-003; la suspensión de quien solicita ya la frenó la sesión en el servidor.
--   sent            se guardó, con su id
--   already         el mismo intento ya había enviado, con su id
--   not_found       el animal no existe
--   own             es de quien solicita
--   you_blocked     quien solicita bloqueó al publicador (gana sobre lo demás, como en la ficha)
--   unavailable     no está a la vista por ahora
--   not_receiving   adoptada, dada de baja, publicador suspendido, o el publicador la bloqueó
--   has_active      ya tiene una activa por ese animal, con su id
--   limit           ya tiene las 3 activas
--   needs_phone     no tiene nivel 1
--   needs_identity  el animal pide nivel 2 y no lo tiene
--   answers_invalid las respuestas no son las que corresponden a este animal
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
     and a.status = 'sent';
  if v_id is not null then
    return query select 'has_active', v_id;
    return;
  end if;

  if (
    select count(*)
      from public.applications a
     where a.applicant_id = p_applicant
       and a.status = 'sent'
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

  return query select 'sent', v_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.application_pet(uuid, uuid) from public, anon, authenticated;
revoke all on function private.pet_receives_applications(public.pets) from public, anon, authenticated;
revoke all on function public.pet_application_view(text) from public, anon, authenticated;
revoke all on function public.apply_context(uuid, text, interval) from public, anon, authenticated;
revoke all on function public.check_application_attempt(uuid, uuid) from public, anon, authenticated;
revoke all on function public.my_applications() from public, anon, authenticated;
revoke all on function public.my_application(uuid) from public, anon, authenticated;
revoke all on function public.submit_application(uuid, uuid, text, jsonb, interval)
  from public, anon, authenticated;

grant execute on function public.pet_application_view(text) to anon, authenticated;
grant execute on function public.my_applications() to authenticated;
grant execute on function public.my_application(uuid) to authenticated;
grant execute on function public.apply_context(uuid, text, interval) to service_role;
grant execute on function public.check_application_attempt(uuid, uuid) to service_role;
grant execute on function public.submit_application(uuid, uuid, text, jsonb, interval) to service_role;
