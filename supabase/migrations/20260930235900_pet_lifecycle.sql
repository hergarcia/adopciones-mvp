-- El ciclo de vida de una publicación (historia #59). `status` guarda lo que elige el publicador;
-- vencida y dada de baja se derivan (research R1): el vencimiento sale del listado en el instante en
-- que pasa, sin una tarea que llegue tarde. Toda escritura sigue pasando por funciones con el
-- candado de la cuenta (R2), y lo público sigue saliendo solo por las funciones de #57, que aprenden
-- los estados (R9).

-- Las columnas ------------------------------------------------------------------------------------

alter table public.pets drop constraint pets_status_valid;

-- `expires_at` con valor por defecto: las publicaciones que ya existen reciben 30 días desde hoy
-- (nunca se les anunció un vencimiento, R3), y una fila escrita sin pasar por `publish_pet` nace con
-- el mismo plazo que publicar.
alter table public.pets
  add column status_changed_at timestamptz not null default now(),
  add column expires_at timestamptz default now() + interval '30 days',
  add column reminder_sent_at timestamptz,
  add column expiry_counted_at timestamptz,
  add column taken_down_at timestamptz,
  add column takedown_reason text,
  add column takedown_note text;

alter table public.pets
  add constraint pets_status_valid
    check (status in ('available', 'in_process', 'paused', 'adopted')),
  -- Pausada y adoptada no vencen (FR-016): sin fecha, no hay qué congelar ni qué renovar.
  add constraint pets_expiry_matches_status
    check ((expires_at is not null) = (status in ('available', 'in_process'))),
  add constraint pets_takedown_reason_valid
    check (
      takedown_reason in (
        'photos_not_the_animal', 'sale_or_money', 'not_dog_or_cat', 'contact_or_address', 'other'
      )
    ),
  add constraint pets_takedown_reason_matches
    check ((takedown_reason is not null) = (taken_down_at is not null)),
  add constraint pets_takedown_note_matches
    check ((takedown_note is not null) = coalesce(takedown_reason = 'other', false)),
  add constraint pets_takedown_note_length
    check (takedown_note is null or char_length(btrim(takedown_note)) between 1 and 300);

comment on column public.pets.status is
  'Lo que elige el publicador. Vencida (expires_at <= now()) y dada de baja (taken_down_at) se '
  'derivan con private.pet_state (historia #59, research R1).';

comment on column public.pets.expires_at is
  'Cuándo vence: 30 días desde que se publicó, renovó, reanudó o volvió a publicar. Nulo en '
  'pausada y adoptada, que no vencen.';

comment on column public.pets.taken_down_at is
  'Dada de baja por quien administra. Nunca vuelve a nulo desde el sitio (FR-006).';

comment on column public.pets.takedown_note is
  'El texto del motivo «otro», que su publicador lee tal cual. Quién decidió la baja no está acá.';

drop index public.pets_listing_idx;
create index pets_listing_idx on public.pets (published_at desc, code desc)
  where status in ('available', 'in_process') and taken_down_at is null;
create index pets_reminder_due_idx on public.pets (expires_at)
  where reminder_sent_at is null and taken_down_at is null;
create index pets_expiry_count_idx on public.pets (expires_at)
  where expiry_counted_at is null and taken_down_at is null;

-- Las reglas --------------------------------------------------------------------------------------

-- Fijas en SQL porque las usa también la tarea de la base; un test las compara con
-- `PET_LIFETIME_DAYS` y `PET_REMINDER_DAYS` de lib/pets/rules.ts (R3).
create or replace function private.pet_lifetime()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '30 days';
$$;

create or replace function private.pet_reminder_lead()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '7 days';
$$;

-- El estado que se ve, en un solo lugar (R1). La misma cuenta que `lifecycleOf` de
-- lib/pets/lifecycle.ts, con un test de paridad: vence en el instante exacto.
create or replace function private.pet_state(
  p_status text,
  p_expires_at timestamptz,
  p_taken_down_at timestamptz
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
           when p_taken_down_at is not null then 'taken_down'
           when p_status in ('available', 'in_process') and p_expires_at <= now() then 'expired'
           else p_status
         end;
$$;

-- A la vista para cualquiera: disponible, en proceso o adoptada, y el publicador con nivel 1 hoy.
create or replace function private.pet_is_shown(p public.pets)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.pet_state(p.status, p.expires_at, p.taken_down_at)
           in ('available', 'in_process', 'adopted')
     and private.pet_is_listed(p.owner_id);
$$;

-- La escalera del nivel de quien publica, que ya estaba dentro de `pet_by_code` (#12): la usan la
-- ficha y, después, la cola de revisión. Supone nivel 1; quien llama ya lo comprobó.
create or replace function private.publisher_level(p_owner uuid)
returns smallint
language sql
stable
set search_path = ''
as $$
  select case
           when not private.has_level_two(p_owner, private.pending_ttl()) then 1::smallint
           when exists (
             select 1
               from public.vouches x
              where x.vouchee_id = p_owner
                and private.has_level_two(x.voucher_id, private.pending_ttl())
           ) then 3::smallint
           else 2::smallint
         end;
$$;

-- Lo público ---------------------------------------------------------------------------------------

-- Cambia el tipo de lo que devuelven: se borran y se vuelven a crear, con sus permisos.
drop function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
);
drop function public.pet_by_code(text);
drop function public.pet_share_card(text);

-- El listado: disponibles y en proceso, sin vencer ni dar de baja (FR-008). Las condiciones sobre
-- las columnas repiten lo que dice `pet_state` para que el índice parcial sirva.
create or replace function public.listed_pets(
  p_species text[] default null,
  p_sexes text[] default null,
  p_sizes text[] default null,
  p_age_bands int4range[] default null,
  p_departments text[] default null,
  p_neutered_only boolean default false,
  p_after_published timestamptz default null,
  p_after_code text default null,
  p_limit integer default 25
)
returns table (
  code text,
  name text,
  species text,
  sex text,
  age_value smallint,
  age_unit text,
  age_as_of date,
  department text,
  locality text,
  is_urgent boolean,
  status text,
  published_at timestamptz,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  total bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with today as (select public.uruguay_today() as day)
  select p.code, p.name, p.species, p.sex, p.age_value, p.age_unit, p.age_as_of, p.department,
         p.locality, p.is_urgent, p.status, p.published_at, ph.id, ph.owner_id, ph.width,
         ph.height, ph.thumbhash, count(*) over ()
    from public.pets p
    join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
    cross join today
   where p.status in ('available', 'in_process')
     and p.taken_down_at is null
     and p.expires_at > now()
     and private.pet_is_listed(p.owner_id)
     and (coalesce(cardinality(p_species), 0) = 0 or p.species = any (p_species))
     and (coalesce(cardinality(p_sexes), 0) = 0 or p.sex = any (p_sexes))
     and (coalesce(cardinality(p_sizes), 0) = 0 or p.size = any (p_sizes))
     and (coalesce(cardinality(p_departments), 0) = 0 or p.department = any (p_departments))
     and (not coalesce(p_neutered_only, false) or p.is_neutered)
     and (
       coalesce(cardinality(p_age_bands), 0) = 0
       or private.pet_age_months(p.age_value, p.age_unit, p.age_as_of, today.day)
          <@ any (p_age_bands)
     )
     and (p_after_published is null or (p.published_at, p.code) < (p_after_published, p_after_code))
   order by p.published_at desc, p.code desc
   limit least(greatest(coalesce(p_limit, 25), 1), 241);
$$;

-- Una ficha (FR-009, FR-013). Para quien no es el publicador, la precedencia de la spec: dada de
-- baja es sin fila, como una que no existe; pausada, vencida y sin nivel 1 dicen solo eso, sin nada
-- del animal ni de quien lo publicó; adoptada y a la vista, la ficha. El publicador la ve entera en
-- cualquier estado, con el motivo de la baja y sin quién la decidió.
create or replace function public.pet_by_code(p_code text)
returns table (
  visibility text,
  is_owner boolean,
  state text,
  pet_id uuid,
  code text,
  name text,
  species text,
  sex text,
  age_value smallint,
  age_unit text,
  age_as_of date,
  size text,
  is_neutered boolean,
  vaccines text,
  has_chip boolean,
  good_with_kids text,
  good_with_dogs text,
  good_with_cats text,
  description text,
  department text,
  locality text,
  is_urgent boolean,
  published_at timestamptz,
  owner_folder uuid,
  photos jsonb,
  version text,
  publisher_name text,
  publisher_avatar_path text,
  publisher_is_rescuer boolean,
  publisher_level smallint,
  takedown_reason text,
  takedown_note text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_pet public.pets%rowtype;
  v_state text;
  v_visibility text;
  v_owner boolean;
begin
  select * into v_pet from public.pets p where p.code = p_code;
  if not found then
    return;
  end if;

  v_state := private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at);
  v_owner := coalesce((select auth.uid()) = v_pet.owner_id, false);
  v_visibility := case
                    when v_state = 'taken_down' then 'hidden'
                    when v_state = 'paused' then 'paused'
                    when v_state = 'expired' then 'expired'
                    when not private.pet_is_listed(v_pet.owner_id) then 'hidden'
                    when v_state = 'adopted' then 'adopted'
                    else 'listed'
                  end;

  if not v_owner then
    if v_state = 'taken_down' then
      return;
    end if;
    if v_visibility not in ('listed', 'adopted') then
      visibility := v_visibility;
      is_owner := false;
      return next;
      return;
    end if;
  end if;

  return query
    select v_visibility,
           v_owner,
           v_state,
           case when v_owner then v_pet.id end,
           v_pet.code, v_pet.name, v_pet.species, v_pet.sex, v_pet.age_value, v_pet.age_unit,
           v_pet.age_as_of, v_pet.size, v_pet.is_neutered, v_pet.vaccines, v_pet.has_chip,
           v_pet.good_with_kids, v_pet.good_with_dogs, v_pet.good_with_cats, v_pet.description,
           v_pet.department, v_pet.locality, v_pet.is_urgent, v_pet.published_at,
           v_pet.owner_id,
           coalesce(
             (select jsonb_agg(
                       jsonb_build_object(
                         'id', ph.id, 'width', ph.width, 'height', ph.height,
                         'thumbhash', ph.thumbhash
                       ) order by ph.position
                     )
                from public.pet_photos ph
               where ph.pet_id = v_pet.id),
             '[]'::jsonb
           ),
           private.pet_share_version(
             (select ph.id from public.pet_photos ph where ph.pet_id = v_pet.id and ph.position = 0),
             v_pet.name, v_pet.department, v_pet.locality
           ),
           pr.display_name, pr.avatar_path, pr.is_rescuer,
           case
             when v_visibility in ('listed', 'adopted') then private.publisher_level(v_pet.owner_id)
           end,
           case when v_owner then v_pet.takedown_reason end,
           case when v_owner then v_pet.takedown_note end
      from (select 1) as one
      left join public.profiles pr on pr.id = v_pet.owner_id;
end;
$$;

-- Lo mínimo para la vista previa, igual para todos: a la vista o adoptada (FR-011). La adoptada lleva
-- su portada y su nombre; la página decide no mostrar la zona.
create or replace function public.pet_share_card(p_code text)
returns table (
  name text,
  sex text,
  status text,
  department text,
  locality text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  version text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.name, p.sex, p.status, p.department, p.locality, ph.id, ph.owner_id, ph.width,
         ph.height, private.pet_share_version(ph.id, p.name, p.department, p.locality)
    from public.pets p
    join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
   where p.code = p_code
     and private.pet_is_shown(p);
$$;

-- Las fotos de lo que está a la vista o adoptada, y la foto de perfil de quien tiene alguno así.
create or replace function private.pet_photo_object_listed(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with parts as (select storage.foldername(object_name) as folder)
  select exists (
    select 1
      from parts
      join public.pet_photos ph
        on parts.folder[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and ph.id = parts.folder[2]::uuid
       and ph.owner_id::text = parts.folder[1]
      join public.pets p on p.id = ph.pet_id
     where private.pet_is_shown(p)
  );
$$;

create or replace function private.avatar_object_listed(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with parts as (select storage.foldername(object_name) as folder)
  select exists (
    select 1
      from parts
      join public.profiles pr
        on parts.folder[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and pr.id = parts.folder[1]::uuid
       and pr.avatar_path = object_name
     where exists (
       select 1 from public.pets p where p.owner_id = pr.id and private.pet_is_shown(p)
     )
  );
$$;

-- Publicar ----------------------------------------------------------------------------------------

-- Igual que en #53, con el vencimiento a 30 días desde ahora (FR-001).
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
    locality, is_urgent, expires_at
  )
  values (
    p_owner, p_attempt, p_fields ->> 'name', p_fields ->> 'species', p_fields ->> 'sex',
    (p_fields ->> 'age_value')::smallint, p_fields ->> 'age_unit',
    (p_fields ->> 'age_as_of')::date, p_fields ->> 'size', (p_fields ->> 'is_neutered')::boolean,
    p_fields ->> 'vaccines', (p_fields ->> 'has_chip')::boolean, p_fields ->> 'good_with_kids',
    p_fields ->> 'good_with_dogs', p_fields ->> 'good_with_cats', p_fields ->> 'description',
    p_fields ->> 'department', p_fields ->> 'locality', (p_fields ->> 'is_urgent')::boolean,
    now() + private.pet_lifetime()
  )
  returning id into v_pet;

  update public.pet_photos ph
     set pet_id = v_pet, position = o.ord - 1
    from unnest(p_photo_ids) with ordinality as o (id, ord)
   where ph.id = o.id;

  return query select v_pet, false;
end;
$$;

-- Cambiar el estado ---------------------------------------------------------------------------------

-- Una acción del publicador sobre una publicación suya (R2, data-model §Transiciones). La tabla de
-- transiciones vive acá; `actionsFor` de lib/pets/lifecycle.ts ofrece exactamente las celdas que
-- hacen algo, con un test de paridad. Dos pestañas, o el publicador y quien administra, chocan en
-- el candado de la fila: el segundo ve `changed` si su acción ya no corresponde (FR-007).
--   done                la acción se aplicó
--   already             ya estaba como lo pide: nada cambia
--   changed             la acción no corresponde al estado de ahora
--   needs_verification  reanudar, renovar y volver a publicar sin nivel 1 (FR-003)
--   taken_down          dada de baja: solo se borra (FR-006)
--   not_found           no existe o no es suya (FR-002)
create or replace function public.change_pet_status(
  p_owner uuid,
  p_pet uuid,
  p_action text,
  p_pending_ttl interval
)
returns table (
  outcome text,
  code text,
  name text,
  sex text,
  from_state text,
  state text,
  expires_at timestamptz,
  published_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet public.pets%rowtype;
  v_from text;
  v_target text;
  v_fresh boolean := false;
  v_republish boolean := false;
begin
  if p_action not in (
    'mark_in_process', 'mark_available', 'pause', 'resume', 'mark_adopted', 'renew', 'republish'
  ) then
    raise exception using errcode = 'P0001', message = 'invalid_action';
  end if;

  perform public.lock_phone_account(p_owner);

  select * into v_pet from public.pets p where p.id = p_pet and p.owner_id = p_owner for update;
  if not found then
    return query select 'not_found', null::text, null::text, null::text, null::text, null::text,
                        null::timestamptz, null::timestamptz;
    return;
  end if;

  v_from := private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at);

  if v_from = 'taken_down' then
    return query select 'taken_down', v_pet.code, v_pet.name, v_pet.sex, v_from, v_from,
                        v_pet.expires_at, v_pet.published_at;
    return;
  end if;

  -- `v_target` es el estado guardado que deja la acción; `v_fresh`, que abre 30 días nuevos.
  case
    when p_action = 'mark_in_process' and v_from = 'available' then v_target := 'in_process';
    when p_action = 'mark_available' and v_from = 'in_process' then v_target := 'available';
    when p_action = 'pause' and v_from in ('available', 'in_process') then v_target := 'paused';
    when p_action = 'resume' and v_from = 'paused' then
      v_target := 'available';
      v_fresh := true;
    when p_action = 'mark_adopted' and v_from in ('available', 'in_process', 'paused', 'expired')
      then v_target := 'adopted';
    when p_action = 'renew' and v_from in ('available', 'in_process') then
      v_target := v_pet.status;
      v_fresh := true;
    when p_action = 'republish' and v_from in ('adopted', 'expired') then
      v_target := 'available';
      v_fresh := true;
      v_republish := true;
    else
      v_target := null;
  end case;

  if v_target is null then
    return query select
      case
        when (p_action, v_from) in (
          ('mark_in_process', 'in_process'), ('mark_available', 'available'), ('pause', 'paused'),
          ('mark_adopted', 'adopted')
        ) then 'already'
        else 'changed'
      end,
      v_pet.code, v_pet.name, v_pet.sex, v_from, v_from, v_pet.expires_at, v_pet.published_at;
    return;
  end if;

  -- Lo que vuelve a poner un animal a la vista exige nivel 1 (FR-003).
  if v_fresh and not public.identity_level_one(p_owner, p_pending_ttl) then
    return query select 'needs_verification', v_pet.code, v_pet.name, v_pet.sex, v_from, v_from,
                        v_pet.expires_at, v_pet.published_at;
    return;
  end if;

  update public.pets p
     set status = v_target,
         status_changed_at = now(),
         expires_at = case
                        when v_target not in ('available', 'in_process') then null
                        when v_fresh then now() + private.pet_lifetime()
                        else p.expires_at
                      end,
         reminder_sent_at = case when v_fresh then null else p.reminder_sent_at end,
         expiry_counted_at = case when v_fresh then null else p.expiry_counted_at end,
         published_at = case when v_republish then now() else p.published_at end
   where p.id = p_pet
  returning * into v_pet;

  return query select 'done', v_pet.code, v_pet.name, v_pet.sex, v_from,
                      private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at),
                      v_pet.expires_at, v_pet.published_at;
end;
$$;

-- Las fotos de una publicación propia, para que la acción borre sus objetos antes que la fila: si
-- Storage falla, la fila sigue y se puede reintentar (contracts §Server Actions).
create or replace function public.pet_photo_ids(p_owner uuid, p_pet uuid)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(ph.id order by ph.position), '{}')
    from public.pet_photos ph
    join public.pets p on p.id = ph.pet_id
   where p.id = p_pet and p.owner_id = p_owner;
$$;

-- Borrar para siempre (FR-005): las fotos, la revisión y los enlaces caen con la fila por la
-- cascada. El código queda en `pet_codes` y no se vuelve a entregar. Vale en cualquier estado.
create or replace function public.delete_pet(p_owner uuid, p_pet uuid)
returns table (outcome text, code text, from_state text, photo_ids uuid[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet public.pets%rowtype;
  v_photos uuid[];
begin
  perform public.lock_phone_account(p_owner);

  select * into v_pet from public.pets p where p.id = p_pet and p.owner_id = p_owner for update;
  if not found then
    return query select 'not_found', null::text, null::text, '{}'::uuid[];
    return;
  end if;

  v_photos := public.pet_photo_ids(p_owner, p_pet);
  delete from public.pets p where p.id = p_pet;

  return query select 'done', v_pet.code,
                      private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at),
                      v_photos;
end;
$$;

-- Guardar ------------------------------------------------------------------------------------------

-- Igual que en #53, y una dada de baja ya no se edita: solo se borra (FR-006). No toca el
-- vencimiento: editar no renueva (US2). Una revisada que se edita vuelve a la lista de quien
-- administra como editada (FR-022); una que todavía espera no cambia: sigue una sola vez, como
-- estaba (spec §Edge Cases). `pet_reviews` se crea más abajo, con la revisión.
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
         is_urgent = (p_fields ->> 'is_urgent')::boolean
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

-- Permisos ----------------------------------------------------------------------------------------

revoke all on function private.pet_lifetime() from public, anon, authenticated;
revoke all on function private.pet_reminder_lead() from public, anon, authenticated;
revoke all on function private.pet_state(text, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function private.pet_is_shown(public.pets) from public, anon, authenticated;
revoke all on function private.publisher_level(uuid) from public, anon, authenticated;

revoke all on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
) from public, anon, authenticated;
revoke all on function public.pet_by_code(text) from public, anon, authenticated;
revoke all on function public.pet_share_card(text) from public, anon, authenticated;
revoke all on function public.change_pet_status(uuid, uuid, text, interval)
  from public, anon, authenticated;
revoke all on function public.pet_photo_ids(uuid, uuid) from public, anon, authenticated;
revoke all on function public.delete_pet(uuid, uuid) from public, anon, authenticated;
revoke all on function public.save_pet(uuid, uuid, interval, interval, jsonb, uuid[])
  from public, anon, authenticated;

grant execute on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
) to anon, authenticated;
grant execute on function public.pet_by_code(text) to anon, authenticated;
grant execute on function public.pet_share_card(text) to anon, authenticated;
grant execute on function public.change_pet_status(uuid, uuid, text, interval) to service_role;
grant execute on function public.pet_photo_ids(uuid, uuid) to service_role;
grant execute on function public.delete_pet(uuid, uuid) to service_role;
grant execute on function public.save_pet(uuid, uuid, interval, interval, jsonb, uuid[])
  to service_role;

-- El recordatorio y «Sigue disponible» ---------------------------------------------------------------

-- Un enlace por correo (research R5). Se guarda el SHA-256 del token, nunca el token: quien lea la
-- tabla no puede armar un enlace. Muere con el animal por la cascada, sin lista de revocados, y nadie
-- desde el navegador lo lee: RLS encendida y sin policies.
create table public.pet_renewal_links (
  token_hash text primary key,
  pet_id uuid not null references public.pets (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint pet_renewal_links_hash_format check (token_hash ~ '^[0-9a-f]{64}$')
);

comment on table public.pet_renewal_links is
  'El enlace «Sigue disponible» de cada recordatorio (historia #59, R5): solo renueva ese animal, '
  'por 30 días desde enviado el correo. Sin datos de la persona.';

create index pet_renewal_links_pet_idx on public.pet_renewal_links (pet_id);
create index pet_renewal_links_expires_idx on public.pet_renewal_links (expires_at);

alter table public.pet_renewal_links enable row level security;
revoke all on table public.pet_renewal_links from anon, authenticated;

-- 30 días: `RENEWAL_LINK_DAYS` de lib/pets/rules.ts, con su test de paridad. Fija en SQL porque
-- crear el enlace y la purga diaria tienen que contar igual.
create or replace function private.pet_renewal_link_lifetime()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '30 days';
$$;

-- Las publicaciones que entraron en sus últimos 7 días sin recordatorio (FR-017). Marca antes de
-- devolver, en la misma sentencia: cada vencimiento sale una sola vez aunque dos vueltas se crucen,
-- y si el envío falla no se reintenta (spec §Edge Cases). Una que se está renovando tiene la fila
-- tomada y se saltea: al soltarla ya no está por vencer.
create or replace function public.claim_pet_reminders(p_limit integer)
returns table (
  pet_id uuid,
  owner_id uuid,
  name text,
  sex text,
  expires_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  with due as (
    select p.id
      from public.pets p
     where p.reminder_sent_at is null
       and p.taken_down_at is null
       and p.status in ('available', 'in_process')
       and p.expires_at > now()
       and p.expires_at <= now() + private.pet_reminder_lead()
     order by p.expires_at
     limit greatest(coalesce(p_limit, 0), 0)
       for update skip locked
  )
  update public.pets p
     set reminder_sent_at = now()
    from due
   where p.id = due.id
  returning p.id, p.owner_id, p.name, p.sex, p.expires_at;
$$;

-- Cada vencimiento se mide una vez (FR-032): marca y devuelve lo que necesita el evento.
create or replace function public.claim_pet_expiries(p_limit integer)
returns table (status text, published_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  with due as (
    select p.id
      from public.pets p
     where p.expiry_counted_at is null
       and p.taken_down_at is null
       and p.status in ('available', 'in_process')
       and p.expires_at <= now()
     order by p.expires_at
     limit greatest(coalesce(p_limit, 0), 0)
       for update skip locked
  )
  update public.pets p
     set expiry_counted_at = now()
    from due
   where p.id = due.id
  returning p.status, p.published_at;
$$;

create or replace function public.create_pet_renewal_link(p_pet uuid, p_token_hash text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.pet_renewal_links (token_hash, pet_id, expires_at)
  values (p_token_hash, p_pet, now() + private.pet_renewal_link_lifetime());
$$;

-- «Sigue disponible» (FR-018, FR-019): solo ese animal, solo renovar. Con el candado de la cuenta
-- del dueño, como desde «Mis animales»: disponible o en proceso se renueva; vencida se vuelve a
-- publicar; pausada, adoptada o dada de baja no cambian y se dice cuál es. La acción la hace
-- `change_pet_status`, así el nivel 1 y lo que deja cada una son los mismos.
--   renewed · republished · paused · adopted · taken_down · needs_verification
--   invalid   el enlace no existe, venció o el animal se borró
create or replace function public.renew_by_link(p_token_hash text, p_pending_ttl interval)
returns table (outcome text, pet_name text, sex text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet uuid;
  v_owner uuid;
  v_row public.pets%rowtype;
  v_state text;
  v_change record;
begin
  select l.pet_id, p.owner_id into v_pet, v_owner
    from public.pet_renewal_links l
    join public.pets p on p.id = l.pet_id
   where l.token_hash = p_token_hash
     and l.expires_at > now();
  if v_pet is null then
    return query select 'invalid', null::text, null::text, null::timestamptz;
    return;
  end if;

  perform public.lock_phone_account(v_owner);

  select * into v_row from public.pets p where p.id = v_pet for update;
  if not found then
    return query select 'invalid', null::text, null::text, null::timestamptz;
    return;
  end if;

  v_state := private.pet_state(v_row.status, v_row.expires_at, v_row.taken_down_at);
  if v_state in ('paused', 'adopted', 'taken_down') then
    return query select v_state, v_row.name, v_row.sex, v_row.expires_at;
    return;
  end if;

  select * into v_change
    from public.change_pet_status(
      v_owner, v_pet, case when v_state = 'expired' then 'republish' else 'renew' end, p_pending_ttl
    );

  return query
    select case
             when v_change.outcome <> 'done' then v_change.outcome
             when v_state = 'expired' then 'republished'
             else 'renewed'
           end,
           v_change.name, v_change.sex, v_change.expires_at;
end;
$$;

-- Lo que muestra la pantalla de resultado y la portada del correo: nombre, sexo, estado y
-- vencimiento, nada de la persona (FR-020). Sin fila si el enlace no sirve.
create or replace function public.renewal_link_view(p_token_hash text)
returns table (
  name text,
  sex text,
  state text,
  expires_at timestamptz,
  cover_id uuid,
  cover_owner uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.name, p.sex, private.pet_state(p.status, p.expires_at, p.taken_down_at), p.expires_at,
         ph.id, ph.owner_id
    from public.pet_renewal_links l
    join public.pets p on p.id = l.pet_id
    left join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
   where l.token_hash = p_token_hash
     and l.expires_at > now();
$$;

-- Como `identity_expiry_mail_tick`: si hay un recordatorio debido o un vencimiento sin medir, le
-- pide a la aplicación que haga el trabajo (R4). Sin la URL o el secreto en Vault no llama a nada.
create or replace function public.pet_lifecycle_tick()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists (
       select 1
         from public.pets p
        where p.reminder_sent_at is null
          and p.taken_down_at is null
          and p.status in ('available', 'in_process')
          and p.expires_at > now()
          and p.expires_at <= now() + private.pet_reminder_lead()
     )
     and not exists (
       select 1
         from public.pets p
        where p.expiry_counted_at is null
          and p.taken_down_at is null
          and p.status in ('available', 'in_process')
          and p.expires_at <= now()
     ) then
    return;
  end if;

  select s.decrypted_secret into v_url from vault.decrypted_secrets s where s.name = 'app_url';
  select s.decrypted_secret into v_secret from vault.decrypted_secrets s where s.name = 'cron_secret';
  if v_url is null or v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := v_url || '/api/cron/publicaciones',
    headers := jsonb_build_object('x-cron-secret', v_secret, 'content-type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

revoke all on function private.pet_renewal_link_lifetime() from public, anon, authenticated;
revoke all on function public.claim_pet_reminders(integer) from public, anon, authenticated;
revoke all on function public.claim_pet_expiries(integer) from public, anon, authenticated;
revoke all on function public.create_pet_renewal_link(uuid, text) from public, anon, authenticated;
revoke all on function public.renew_by_link(text, interval) from public, anon, authenticated;
revoke all on function public.renewal_link_view(text) from public, anon, authenticated;
revoke all on function public.pet_lifecycle_tick() from public, anon, authenticated;

grant execute on function public.claim_pet_reminders(integer) to service_role;
grant execute on function public.claim_pet_expiries(integer) to service_role;
grant execute on function public.create_pet_renewal_link(uuid, text) to service_role;
grant execute on function public.renew_by_link(text, interval) to service_role;
grant execute on function public.renewal_link_view(text) to service_role;
grant execute on function public.pet_lifecycle_tick() to service_role;

select cron.schedule('pet-lifecycle', '*/5 * * * *', 'select public.pet_lifecycle_tick()');
-- Un día de gracia después de vencer: la pantalla de resultado de un toque de último momento todavía
-- encuentra el enlace al recargarse.
select cron.schedule(
  'pet-renewal-links-purge',
  '17 4 * * *',
  'delete from public.pet_renewal_links where expires_at < now() - interval ''1 day'''
);

-- La revisión de quien administra ------------------------------------------------------------------

-- Una fila por publicación (research R8): pendiente (`new` o `edited`, desde cuándo) o resuelta
-- (cuándo, por quién y cómo). Quién decidió solo lo leen quienes administran (FR-029); el motivo de
-- una baja vive en `pets`, donde su publicador lo lee sin ver quién la decidió. Se borra con la
-- publicación (FR-030).
create table public.pet_reviews (
  pet_id uuid primary key references public.pets (id) on delete cascade,
  pending_kind text,
  pending_since timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  outcome text,
  constraint pet_reviews_pending_kind_valid check (pending_kind in ('new', 'edited')),
  constraint pet_reviews_pending_matches check ((pending_since is null) = (pending_kind is null)),
  constraint pet_reviews_outcome_valid check (outcome in ('reviewed', 'taken_down'))
);

comment on table public.pet_reviews is
  'La revisión de cada publicación por quien administra (historia #59, R8). `resolved_by` nulo con '
  '`resolved_at` es una cuenta que se borró.';

create index pet_reviews_pending_idx on public.pet_reviews (pending_since)
  where pending_since is not null;
create index pet_reviews_resolved_by_idx on public.pet_reviews (resolved_by);

alter table public.pet_reviews enable row level security;

create policy pet_reviews_select_admin on public.pet_reviews
  for select to authenticated
  using ((select private.is_admin()));

revoke all on table public.pet_reviews from anon, authenticated;
grant select on table public.pet_reviews to authenticated;

-- Lo que ya estaba publicado nunca se revisó: entra a la lista desde que se publicó.
insert into public.pet_reviews (pet_id, pending_kind, pending_since)
select p.id, 'new', p.published_at
  from public.pets p
 where p.taken_down_at is null;

-- Toda publicación nueva entra a la lista en el momento en que sale a la vista (FR-022).
create or replace function private.pet_review_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.pet_reviews (pet_id, pending_kind, pending_since)
  values (new.id, 'new', now());
  return null;
end;
$$;

create trigger pets_review_on_insert
  after insert on public.pets
  for each row execute function private.pet_review_on_insert();

-- Lo que espera revisión, de lo que más espera a lo que menos (R8, FR-024): todo lo del animal y,
-- de quien publica, solo el nombre, la foto y el nivel; nunca su zona ni su contacto. Para quien no
-- administra, ninguna fila: se pregunta en cada lectura (FR-023). `others` son las que no son de
-- quien mira, que es lo que espera por esa persona.
create or replace function public.pet_review_queue(p_limit integer)
returns table (
  pet_id uuid,
  code text,
  name text,
  species text,
  sex text,
  age_value smallint,
  age_unit text,
  age_as_of date,
  size text,
  is_neutered boolean,
  vaccines text,
  has_chip boolean,
  good_with_kids text,
  good_with_dogs text,
  good_with_cats text,
  description text,
  department text,
  locality text,
  is_urgent boolean,
  state text,
  pending_kind text,
  pending_since timestamptz,
  is_own boolean,
  owner_folder uuid,
  photos jsonb,
  publisher_name text,
  publisher_avatar_path text,
  publisher_is_rescuer boolean,
  publisher_level smallint,
  total bigint,
  others bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    return;
  end if;

  return query
    select p.id, p.code, p.name, p.species, p.sex, p.age_value, p.age_unit, p.age_as_of, p.size,
           p.is_neutered, p.vaccines, p.has_chip, p.good_with_kids, p.good_with_dogs,
           p.good_with_cats, p.description, p.department, p.locality, p.is_urgent,
           private.pet_state(p.status, p.expires_at, p.taken_down_at),
           r.pending_kind, r.pending_since,
           p.owner_id = (select auth.uid()),
           p.owner_id,
           coalesce(
             (select jsonb_agg(
                       jsonb_build_object(
                         'id', ph.id, 'width', ph.width, 'height', ph.height,
                         'thumbhash', ph.thumbhash
                       ) order by ph.position
                     )
                from public.pet_photos ph
               where ph.pet_id = p.id),
             '[]'::jsonb
           ),
           pr.display_name, pr.avatar_path, pr.is_rescuer,
           -- Sin nivel 1 no hay escalera: la pantalla lo dice en palabras.
           case when private.pet_is_listed(p.owner_id) then private.publisher_level(p.owner_id) end,
           count(*) over (),
           count(*) filter (where p.owner_id <> (select auth.uid())) over ()
      from public.pet_reviews r
      join public.pets p on p.id = r.pet_id
      left join public.profiles pr on pr.id = p.owner_id
     where r.pending_since is not null
       and p.taken_down_at is null
     order by r.pending_since, p.id
     limit least(greatest(coalesce(p_limit, 20), 1), 100);
end;
$$;

-- Cuántas esperan a quien mira, sin las propias (FR-028). Cero para quien no administra.
create or replace function public.count_pet_reviews()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when private.is_admin() then (
             select count(*)::integer
               from public.pet_reviews r
               join public.pets p on p.id = r.pet_id
              where r.pending_since is not null
                and p.taken_down_at is null
                and p.owner_id <> (select auth.uid())
           )
           else 0
         end;
$$;

-- Resolver una (R8, FR-025–FR-027), con el candado de la cuenta del publicador: una baja y un
-- cambio de estado suyo van de a uno. `p_known_since` es la espera que vio la pantalla: si otra
-- persona ya la resolvió o el publicador la volvió a editar, es `closed` y nada cambia. Quién
-- administra se pregunta acá adentro (FR-023).
--   reviewed · taken_down   se aplicó
--   closed                  ya no espera como la vio la pantalla
--   own                     es de quien administra (FR-026)
--   not_admin               ya no administra
--   gone                    la publicación se borró
create or replace function public.resolve_pet_review(
  p_admin uuid,
  p_pet uuid,
  p_known_since timestamptz,
  p_outcome text,
  p_reason text default null,
  p_note text default null
)
returns table (
  decision text,
  owner_id uuid,
  pet_name text,
  sex text,
  code text,
  kind text,
  pending_since timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_pet public.pets%rowtype;
  v_review public.pet_reviews%rowtype;
begin
  if p_outcome is null
     or p_outcome not in ('reviewed', 'taken_down')
     or (p_outcome = 'taken_down') <> (p_reason is not null)
     or coalesce(p_reason = 'other', false) <> (p_note is not null) then
    raise exception using errcode = 'P0001', message = 'invalid_resolution';
  end if;

  if not exists (select 1 from public.admins a where a.user_id = p_admin) then
    decision := 'not_admin';
    return next;
    return;
  end if;

  select p.owner_id into v_owner from public.pets p where p.id = p_pet;
  if v_owner is null then
    decision := 'gone';
    return next;
    return;
  end if;

  perform public.lock_phone_account(v_owner);

  select * into v_pet from public.pets p where p.id = p_pet for update;
  if not found then
    decision := 'gone';
    return next;
    return;
  end if;
  if v_pet.owner_id = p_admin then
    decision := 'own';
    return next;
    return;
  end if;

  select * into v_review from public.pet_reviews r where r.pet_id = p_pet for update;
  if v_review.pending_since is null
     or v_review.pending_since <> p_known_since
     or v_pet.taken_down_at is not null then
    decision := 'closed';
    return next;
    return;
  end if;

  if p_outcome = 'taken_down' then
    update public.pets p
       set taken_down_at = now(),
           takedown_reason = p_reason,
           takedown_note = btrim(p_note),
           status_changed_at = now()
     where p.id = p_pet;
    -- Un «Sigue disponible» viejo ya no tiene qué renovar (FR-027).
    delete from public.pet_renewal_links l where l.pet_id = p_pet;
  end if;

  update public.pet_reviews r
     set pending_kind = null,
         pending_since = null,
         resolved_at = now(),
         resolved_by = p_admin,
         outcome = p_outcome
   where r.pet_id = p_pet;

  return query select p_outcome, v_pet.owner_id, v_pet.name, v_pet.sex, v_pet.code,
                      v_review.pending_kind, v_review.pending_since;
end;
$$;

-- Las fotos de una publicación que espera revisión y la foto de su publicador, para quien
-- administra (FR-024): solo mientras espera, aunque no esté a la vista (spec §Assumptions).
create or replace function private.pet_photo_object_in_review(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with parts as (select storage.foldername(object_name) as folder)
  select exists (
    select 1
      from parts
      join public.pet_photos ph
        on parts.folder[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and ph.id = parts.folder[2]::uuid
       and ph.owner_id::text = parts.folder[1]
      join public.pets p on p.id = ph.pet_id
      join public.pet_reviews r on r.pet_id = p.id
     where r.pending_since is not null
       and p.taken_down_at is null
  );
$$;

create or replace function private.avatar_object_in_review(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with parts as (select storage.foldername(object_name) as folder)
  select exists (
    select 1
      from parts
      join public.profiles pr
        on parts.folder[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and pr.id = parts.folder[1]::uuid
       and pr.avatar_path = object_name
     where exists (
       select 1
         from public.pets p
         join public.pet_reviews r on r.pet_id = p.id
        where p.owner_id = pr.id
          and r.pending_since is not null
          and p.taken_down_at is null
     )
  );
$$;

-- `is_admin` primero y como subconsulta: para quien no administra, la policy no busca nada más.
create policy pet_photos_objects_select_review on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pet-photos'
    and (select private.is_admin())
    and private.pet_photo_object_in_review(name)
  );

create policy avatars_select_review_publisher on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (select private.is_admin())
    and private.avatar_object_in_review(name)
  );

revoke all on function private.pet_review_on_insert() from public, anon, authenticated;
revoke all on function public.pet_review_queue(integer) from public, anon, authenticated;
revoke all on function public.count_pet_reviews() from public, anon, authenticated;
revoke all on function public.resolve_pet_review(uuid, uuid, timestamptz, text, text, text)
  from public, anon, authenticated;
revoke all on function private.pet_photo_object_in_review(text) from public, anon, authenticated;
revoke all on function private.avatar_object_in_review(text) from public, anon, authenticated;

grant execute on function public.pet_review_queue(integer) to authenticated;
grant execute on function public.count_pet_reviews() to authenticated;
grant execute on function public.resolve_pet_review(uuid, uuid, timestamptz, text, text, text)
  to service_role;
grant execute on function private.pet_photo_object_in_review(text) to authenticated;
grant execute on function private.avatar_object_in_review(text) to authenticated;
