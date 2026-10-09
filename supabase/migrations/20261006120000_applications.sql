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

-- Retirada y cerrada no vuelven a estar activas, ni cambian de motivo (FR-052, FR-061). La única
-- excepción es el bloqueo mutuo: si quien solicitó bloquea después a quien ya la había bloqueado,
-- ve «bloqueaste», que ya sabe, y nunca el bloqueo de la otra (spec §Assumptions).
create or replace function private.applications_forward_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'sent'
     and (new.status is distinct from old.status
          or new.close_reason is distinct from old.close_reason)
     and not (old.close_reason = 'not_receiving'
              and new.status = 'closed'
              and new.close_reason = 'you_blocked') then
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
-- Retirar
-- ---------------------------------------------------------------------------------------------

-- Con el mismo candado que enviar: retirar en una pestaña mientras se envía en otra no deja pasar
-- una cuarta (FR-050). Lo que no es de quien retira se ve como inexistente (FR-070).
--   withdrawn          quedó retirada; con la fecha de envío y el animal, para medir y refrescar
--   already_withdrawn  ya estaba retirada (otra pestaña)
--   closed             se cerró mientras tanto, con el motivo
--   not_found          no existe o no es suya
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
revoke all on function public.withdraw_application(uuid, uuid) from public, anon, authenticated;

grant execute on function public.pet_application_view(text) to anon, authenticated;
grant execute on function public.my_applications() to authenticated;
grant execute on function public.my_application(uuid) to authenticated;
grant execute on function public.apply_context(uuid, text, interval) to service_role;
grant execute on function public.check_application_attempt(uuid, uuid) to service_role;
grant execute on function public.submit_application(uuid, uuid, text, jsonb, interval) to service_role;
grant execute on function public.withdraw_application(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------------------------
-- Quién puede solicitar, al publicar y al editar (US3, research R9)
-- ---------------------------------------------------------------------------------------------

-- Las dos de la #59, con el nivel exigido en el mismo guardado: atómico con el resto de la
-- publicación. Sin el campo queda en teléfono verificado (FR-010).
create or replace function public.publish_pet(
  p_owner uuid,
  p_attempt uuid,
  p_pending_ttl interval,
  p_staged_ttl interval,
  p_fields jsonb,
  p_photo_ids uuid[]
)
returns table (pet_id uuid, already boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet uuid;
  v_count integer := coalesce(cardinality(p_photo_ids), 0);
  v_ready integer;
begin
  perform public.lock_phone_account(p_owner);

  select p.id into v_pet from public.pets p where p.owner_id = p_owner and p.attempt_id = p_attempt;
  if v_pet is not null then
    return query select v_pet, true;
    return;
  end if;

  if not public.identity_level_one(p_owner, p_pending_ttl) then
    raise exception using errcode = 'P0001', message = 'needs_verification';
  end if;

  select count(distinct ph.id) into v_ready
    from public.pet_photos ph
   where ph.id = any (p_photo_ids)
     and ph.owner_id = p_owner
     and ph.pet_id is null
     and ph.released_at is null
     and ph.staged_at > now() - p_staged_ttl;

  if v_count not between 1 and 5 or v_ready <> v_count then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  insert into public.pets (
    owner_id, attempt_id, name, species, sex, age_value, age_unit, age_as_of, size, is_neutered,
    vaccines, has_chip, good_with_kids, good_with_dogs, good_with_cats, description, department,
    locality, is_urgent, required_level, expires_at
  )
  values (
    p_owner, p_attempt, p_fields ->> 'name', p_fields ->> 'species', p_fields ->> 'sex',
    (p_fields ->> 'age_value')::smallint, p_fields ->> 'age_unit',
    (p_fields ->> 'age_as_of')::date, p_fields ->> 'size', (p_fields ->> 'is_neutered')::boolean,
    p_fields ->> 'vaccines', (p_fields ->> 'has_chip')::boolean, p_fields ->> 'good_with_kids',
    p_fields ->> 'good_with_dogs', p_fields ->> 'good_with_cats', p_fields ->> 'description',
    p_fields ->> 'department', p_fields ->> 'locality', (p_fields ->> 'is_urgent')::boolean,
    coalesce((p_fields ->> 'required_level')::smallint, 1), now() + private.pet_lifetime()
  )
  returning id into v_pet;

  update public.pet_photos ph
     set pet_id = v_pet, position = o.ord - 1
    from unnest(p_photo_ids) with ordinality as o (id, ord)
   where ph.id = o.id;

  return query select v_pet, false;
end;
$$;

create or replace function public.save_pet(
  p_owner uuid,
  p_pet uuid,
  p_pending_ttl interval,
  p_staged_ttl interval,
  p_fields jsonb,
  p_photo_ids uuid[]
)
returns setof uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := coalesce(cardinality(p_photo_ids), 0);
  v_known integer;
  v_fresh integer;
  v_taken_down_at timestamptz;
begin
  perform public.lock_phone_account(p_owner);

  select p.taken_down_at into v_taken_down_at
    from public.pets p
   where p.id = p_pet and p.owner_id = p_owner;
  if not found then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  if v_taken_down_at is not null then
    raise exception using errcode = 'P0001', message = 'taken_down';
  end if;

  if not public.identity_level_one(p_owner, p_pending_ttl) then
    raise exception using errcode = 'P0001', message = 'needs_verification';
  end if;

  if v_count not between 1 and 5
     or (select count(distinct x) from unnest(p_photo_ids) as x) <> v_count then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  -- Una foto de la pantalla que ya no está enganchada a este animal ni en espera: otra pestaña la
  -- sacó, y guardar ahora no dejaría el animal como se ve (FR-020a de la #53).
  select count(*) into v_known
    from public.pet_photos ph
   where ph.id = any (p_photo_ids)
     and ph.owner_id = p_owner
     and (ph.pet_id = p_pet or (ph.pet_id is null and ph.released_at is null));
  if v_known <> v_count then
    raise exception using errcode = 'P0001', message = 'changed_elsewhere';
  end if;

  select count(*) into v_fresh
    from public.pet_photos ph
   where ph.id = any (p_photo_ids)
     and ph.pet_id is null
     and ph.staged_at <= now() - p_staged_ttl;
  if v_fresh > 0 then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  update public.pets p
     set name = p_fields ->> 'name',
         species = p_fields ->> 'species',
         sex = p_fields ->> 'sex',
         age_value = (p_fields ->> 'age_value')::smallint,
         age_unit = p_fields ->> 'age_unit',
         age_as_of = (p_fields ->> 'age_as_of')::date,
         size = p_fields ->> 'size',
         is_neutered = (p_fields ->> 'is_neutered')::boolean,
         vaccines = p_fields ->> 'vaccines',
         has_chip = (p_fields ->> 'has_chip')::boolean,
         good_with_kids = p_fields ->> 'good_with_kids',
         good_with_dogs = p_fields ->> 'good_with_dogs',
         good_with_cats = p_fields ->> 'good_with_cats',
         description = p_fields ->> 'description',
         department = p_fields ->> 'department',
         locality = p_fields ->> 'locality',
         is_urgent = (p_fields ->> 'is_urgent')::boolean,
         required_level = coalesce((p_fields ->> 'required_level')::smallint, 1)
   where p.id = p_pet;

  insert into public.pet_reviews as r (pet_id, pending_kind, pending_since)
  values (p_pet, 'edited', now())
  on conflict (pet_id) do update
    set pending_kind = 'edited', pending_since = now()
    where r.pending_kind is null;

  return query
    update public.pet_photos ph
       set pet_id = null, position = null, released_at = now()
     where ph.pet_id = p_pet and ph.id <> all (p_photo_ids)
    returning ph.id;

  update public.pet_photos ph
     set pet_id = p_pet, position = o.ord - 1
    from unnest(p_photo_ids) with ordinality as o (id, ord)
   where ph.id = o.id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- El correo de identidad aprobada lleva al animal desde el que se pidió (US3, research R10)
-- ---------------------------------------------------------------------------------------------

-- Cambia la firma: se borra la vieja, así no quedan dos funciones con el mismo nombre.
drop function public.submit_identity_request(
  uuid, text, text, text, interval, integer, integer, interval
);

create or replace function public.submit_identity_request(
  p_user_id uuid,
  p_origin text,
  p_front text,
  p_selfie text,
  p_ttl interval,
  p_window_days integer,
  p_cap integer,
  p_pending_ttl interval,
  p_return_code text default null
)
returns table (decision text, request_id uuid, retry_on date)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_open record;
  v_id uuid;
begin
  perform public.lock_identity_account(p_user_id);

  if exists (select 1 from public.identity_verifications v where v.user_id = p_user_id) then
    decision := 'already_verified';
    return next;
    return;
  end if;

  select r.id, r.expires_at into v_open
    from public.identity_requests r
   where r.user_id = p_user_id;
  if v_open.id is not null and v_open.expires_at > now() then
    decision := 'already_open';
    return next;
    return;
  end if;

  if not public.identity_level_one(p_user_id, p_pending_ttl) then
    decision := 'no_phone';
    return next;
    return;
  end if;

  retry_on := public.identity_retry_on(p_user_id, p_window_days, p_cap);
  if retry_on is not null then
    decision := 'capped';
    return next;
    return;
  end if;

  -- Uno vencido que la tarea todavía no borró: la persona ya lo ve vencido y pide otro, que lo
  -- reemplaza con sus imágenes.
  if v_open.id is not null then
    delete from public.identity_requests r where r.id = v_open.id;
  end if;

  -- Un código que no existe se ignora: el pedido vale igual, con el correo de siempre.
  insert into public.identity_requests (user_id, expires_at, origin, return_pet_id)
  values (
    p_user_id, now() + p_ttl, p_origin,
    (select p.id from public.pets p where p.code = p_return_code)
  )
  returning id into v_id;

  insert into public.identity_request_images (request_id, kind, data)
  values
    (v_id, 'front', decode(p_front, 'base64')),
    (v_id, 'selfie', decode(p_selfie, 'base64'));

  delete from public.identity_expirations e where e.user_id = p_user_id;

  decision := 'sent';
  request_id := v_id;
  return next;
end;
$$;

-- Cambia lo que devuelve: el código y el nombre del animal desde el que se pidió, si sigue
-- existiendo. Se lee antes de borrar el pedido, que se lleva la referencia.
drop function public.resolve_identity_request(uuid, uuid, text, integer, integer, interval, text);

create or replace function public.resolve_identity_request(
  p_request_id uuid,
  p_admin uuid,
  p_outcome text,
  p_window_days integer,
  p_cap integer,
  p_pending_ttl interval,
  p_reason text default null
)
returns table (
  decision text,
  owner_id uuid,
  request_sent_at timestamptz,
  request_origin text,
  resolved_on date,
  rejections_in_window integer,
  retry_on date,
  level_one boolean,
  return_code text,
  return_name text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid;
  v_open record;
  v_today date := public.uruguay_today();
begin
  if p_outcome not in ('approve', 'reject') or (p_outcome = 'reject') <> (p_reason is not null) then
    raise exception 'resolve_identity_request: resultado % con motivo %', p_outcome, p_reason;
  end if;

  if not exists (select 1 from public.admins a where a.user_id = p_admin) then
    decision := 'not_admin';
    return next;
    return;
  end if;

  select r.user_id into v_owner from public.identity_requests r where r.id = p_request_id;
  if v_owner is null then
    decision := 'gone';
    return next;
    return;
  end if;

  perform public.lock_identity_account(v_owner);

  select r.id, r.user_id, r.sent_at, r.origin, r.expires_at, r.return_pet_id into v_open
    from public.identity_requests r
   where r.id = p_request_id
     for update;

  if v_open.id is null then
    decision := 'gone';
    return next;
    return;
  end if;
  if v_open.user_id = p_admin then
    decision := 'own_request';
    return next;
    return;
  end if;
  if v_open.expires_at <= now() then
    decision := 'expired';
    return next;
    return;
  end if;

  delete from public.identity_requests r where r.id = p_request_id;

  if p_outcome = 'approve' then
    insert into public.identity_verifications (user_id, verified_on) values (v_owner, v_today);
    decision := 'approved';
  else
    insert into public.identity_rejections (user_id, rejected_on, reason)
    values (v_owner, v_today, p_reason);
    decision := 'rejected';
  end if;

  insert into public.identity_resolutions (request_id, user_id, resolved_by)
  values (p_request_id, v_owner, p_admin);

  owner_id := v_owner;
  request_sent_at := v_open.sent_at;
  request_origin := v_open.origin;
  resolved_on := v_today;
  select count(*)::integer into rejections_in_window
    from public.identity_rejections j
   where j.user_id = v_owner
     and j.rejected_on > v_today - p_window_days;
  retry_on := public.identity_retry_on(v_owner, p_window_days, p_cap);
  level_one := public.identity_level_one(v_owner, p_pending_ttl);
  select p.code, p.name into return_code, return_name
    from public.pets p
   where p.id = v_open.return_pet_id;
  return next;
end;
$$;

revoke all on function public.submit_identity_request(
  uuid, text, text, text, interval, integer, integer, interval, text
) from public, anon, authenticated;
revoke all on function public.resolve_identity_request(
  uuid, uuid, text, integer, integer, interval, text
) from public, anon, authenticated;
grant execute on function public.submit_identity_request(
  uuid, text, text, text, interval, integer, integer, interval, text
) to service_role;
grant execute on function public.resolve_identity_request(
  uuid, uuid, text, integer, integer, interval, text
) to service_role;

-- ---------------------------------------------------------------------------------------------
-- Los cierres (US4, research R3)
-- ---------------------------------------------------------------------------------------------

-- Los escribe la base en el mismo momento que su causa, así ningún camino que adopta, borra, da de
-- baja, bloquea o suspende se olvida de cerrar. Solo tocan las activas, guardan el nombre de hoy
-- del animal (FR-065) y nada los reabre (FR-061, FR-062, FR-064). Pausar, vencer y que el
-- publicador pierda el nivel 1 no escriben nada: esa nota se deriva al leer (R6).

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
    update public.applications a
       set status = 'closed', close_reason = v_reason, changed_at = now(), pet_name = new.name
     where a.pet_id = new.id
       and a.status = 'sent';
  end if;
  return null;
end;
$$;

create trigger applications_close_on_pet_change
  after update of status, taken_down_at on public.pets
  for each row execute function private.applications_close_on_pet_change();

-- También el borrado en cascada de la cuenta del publicador (FR-061): la FK deja `pet_id` nulo y la
-- solicitud queda con el nombre que tenía.
create or replace function private.applications_close_on_pet_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.applications a
     set status = 'closed', close_reason = 'unpublished', changed_at = now(), pet_name = old.name
   where a.pet_id = old.id
     and a.status = 'sent';
  return old;
end;
$$;

create trigger applications_close_on_pet_delete
  before delete on public.pets
  for each row execute function private.applications_close_on_pet_delete();

-- Las activas entre las dos, en las dos direcciones (FR-062): la bloqueada ve que el animal ya no
-- recibe, sin saber por qué; quien bloqueó, que bloqueó. En un bloqueo mutuo, quien solicitó ve
-- lo suyo aunque la otra haya bloqueado primero.
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
     and a.status = 'sent';

  update public.applications a
     set status = 'closed',
         close_reason = 'you_blocked',
         changed_at = now(),
         pet_name = coalesce((select p.name from public.pets p where p.id = a.pet_id), a.pet_name)
   where a.applicant_id = new.blocker_id
     and a.publisher_id = new.blocked_id
     and a.status = 'sent';

  -- Ya cerrada por el bloqueo de la otra: cambia el motivo, no cuándo se cerró.
  update public.applications a
     set close_reason = 'you_blocked'
   where a.applicant_id = new.blocker_id
     and a.publisher_id = new.blocked_id
     and a.status = 'closed'
     and a.close_reason = 'not_receiving';
  return null;
end;
$$;

create trigger applications_close_on_block
  after insert on public.blocks
  for each row execute function private.applications_close_on_block();

-- Las de la suspendida se cierran por su suspensión, que ya conoce; las dirigidas a sus animales,
-- como si el animal ya no estuviera publicado (FR-064).
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
     and a.status = 'sent';

  update public.applications a
     set status = 'closed',
         close_reason = 'unpublished',
         changed_at = now(),
         pet_name = coalesce((select p.name from public.pets p where p.id = a.pet_id), a.pet_name)
   where a.publisher_id = new.user_id
     and a.status = 'sent';
  return null;
end;
$$;

create trigger applications_close_on_suspension
  after insert on public.account_suspensions
  for each row
  when (new.lifted_at is null)
  execute function private.applications_close_on_suspension();

-- Para medir (R11): los motivos de las que se cerraron desde que empezó una acción, por ese animal
-- o por esa persona, en cualquiera de las dos puntas. Sin ids: la medición no sabe de quién.
create or replace function public.closed_applications_since(
  p_since timestamptz,
  p_pet uuid default null,
  p_user uuid default null
)
returns table (reason text)
language sql
stable
security definer
set search_path = ''
as $$
  select a.close_reason
    from public.applications a
   where a.status = 'closed'
     and a.changed_at >= p_since
     and (a.pet_id = p_pet or a.applicant_id = p_user or a.publisher_id = p_user);
$$;

revoke all on function private.applications_close_on_pet_change() from public, anon, authenticated;
revoke all on function private.applications_close_on_pet_delete() from public, anon, authenticated;
revoke all on function private.applications_close_on_block() from public, anon, authenticated;
revoke all on function private.applications_close_on_suspension() from public, anon, authenticated;
revoke all on function public.closed_applications_since(timestamptz, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.closed_applications_since(timestamptz, uuid, uuid) to service_role;
