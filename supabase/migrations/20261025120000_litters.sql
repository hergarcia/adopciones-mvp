-- Una camada (#205): lo común en `litters` y cada cría como una fila de `pets` con lo común copiado
-- (research R1), así pedir una cría es pedir un animal sin tocar las solicitudes.

create table public.litters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  attempt_id uuid not null,
  code text not null,
  name text not null,
  species text not null,
  age_value smallint not null,
  age_unit text not null,
  age_as_of date not null,
  size text not null,
  is_neutered boolean not null,
  vaccines text not null,
  has_chip boolean not null,
  good_with_kids text not null default 'unknown',
  good_with_dogs text not null default 'unknown',
  good_with_cats text not null default 'unknown',
  description text,
  department text not null,
  locality text not null,
  is_urgent boolean not null default false,
  required_level smallint not null default 1,
  delivers_from date,
  taken_down_at timestamptz,
  takedown_reason text,
  takedown_note text,
  language text not null default 'es',
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint litters_attempt_unique unique (owner_id, attempt_id),
  constraint litters_code_unique unique (code),
  constraint litters_code_format check (code ~ '^[0-9a-hjkmnp-tv-z]{10}$'),
  constraint litters_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint litters_species_valid check (species in ('dog', 'cat')),
  constraint litters_age_unit_valid check (age_unit in ('months', 'years')),
  constraint litters_age_range check (
    (age_unit = 'months' and age_value between 1 and 11)
    or (age_unit = 'years' and age_value between 1 and 25)
  ),
  constraint litters_size_valid check (size in ('small', 'medium', 'large')),
  constraint litters_vaccines_valid check (vaccines in ('up_to_date', 'incomplete', 'none')),
  constraint litters_good_with_kids_valid check (good_with_kids in ('yes', 'no', 'unknown')),
  constraint litters_good_with_dogs_valid check (good_with_dogs in ('yes', 'no', 'unknown')),
  constraint litters_good_with_cats_valid check (good_with_cats in ('yes', 'no', 'unknown')),
  constraint litters_description_length check (
    description is null or char_length(description) <= 8000
  ),
  constraint litters_department_valid check (department in (
    'UY-AR', 'UY-CA', 'UY-CL', 'UY-CO', 'UY-DU', 'UY-FS', 'UY-FD', 'UY-LA', 'UY-MA', 'UY-MO',
    'UY-PA', 'UY-RV', 'UY-RO', 'UY-RN', 'UY-SA', 'UY-SJ', 'UY-SO', 'UY-TA', 'UY-TT'
  )),
  constraint litters_locality_length check (char_length(btrim(locality)) between 1 and 60),
  constraint litters_required_level_valid check (required_level in (1, 2)),
  constraint litters_takedown_reason_valid check (takedown_reason in (
    'photos_not_the_animal', 'sale_or_money', 'not_dog_or_cat', 'contact_or_address', 'other'
  )),
  constraint litters_takedown_reason_matches check (
    (takedown_reason is not null) = (taken_down_at is not null)
  ),
  constraint litters_takedown_note_matches check (
    (takedown_note is not null) = coalesce(takedown_reason = 'other', false)
  ),
  constraint litters_takedown_note_length check (
    takedown_note is null or char_length(btrim(takedown_note)) between 1 and 300
  ),
  constraint litters_language_valid check (language = 'es')
);

create index litters_owner_published_idx on public.litters (owner_id, published_at desc);
create index litters_listing_idx on public.litters (published_at desc, code desc)
  where taken_down_at is null;

-- El código sale del mismo pozo que el de los animales: ninguno se repite entre los dos, y el cursor
-- del listado `(published_at, code)` sigue siendo un orden total con los dos mezclados (R3).
create trigger litters_assign_code
  before insert on public.litters
  for each row execute function private.assign_pet_code();

create trigger litters_keep_code
  before update of code on public.litters
  for each row execute function private.keep_pet_code();

create trigger litters_touch_updated_at
  before update on public.litters
  for each row execute function public.touch_updated_at();

alter table public.litters enable row level security;

create policy litters_select_own on public.litters
  for select to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on public.litters from anon, authenticated;
grant select on public.litters to authenticated;

-- Una cría es un animal con `litter_id`. Dos crías de una camada no se llaman igual, sin mirar
-- mayúsculas ni espacios de los bordes (FR-008); diferida, para que un guardado pueda intercambiar
-- dos nombres.
alter table public.pets
  add column litter_id uuid references public.litters (id) on delete cascade,
  add column name_key text generated always as (lower(btrim(name))) stored;

alter table public.pets
  add constraint pets_litter_name_unique unique (litter_id, name_key) deferrable initially deferred;

create index pets_litter_idx on public.pets (litter_id) where litter_id is not null;

-- Una foto es de un animal, de una cría (las dos en `pet_id`) o de una camada, nunca de dos (R7).
alter table public.pet_photos
  add column litter_id uuid references public.litters (id) on delete cascade;

alter table public.pet_photos
  add constraint pet_photos_one_owner check (pet_id is null or litter_id is null),
  drop constraint pet_photos_attached_has_position,
  add constraint pet_photos_attached_has_position check (
    (pet_id is null and litter_id is null) = (position is null)
  ),
  drop constraint pet_photos_released_detached,
  add constraint pet_photos_released_detached check (
    released_at is null or (pet_id is null and litter_id is null)
  ),
  add constraint pet_photos_litter_position_unique unique (litter_id, position)
    deferrable initially deferred;

create index pet_photos_litter_idx on public.pet_photos (litter_id) where litter_id is not null;

-- La camada entra a la revisión como una sola entrada (R8).
alter table public.pet_reviews
  drop constraint pet_reviews_pkey,
  alter column pet_id drop not null,
  add column litter_id uuid references public.litters (id) on delete cascade,
  add constraint pet_reviews_pet_unique unique (pet_id),
  add constraint pet_reviews_litter_unique unique (litter_id),
  add constraint pet_reviews_one_subject check (num_nonnulls(pet_id, litter_id) = 1);

-- Una foto pegada a una camada no está en espera: ni la purga ni un animal nuevo la toman.
create or replace function public.purge_pet_photos(p_staged_ttl interval)
returns table (id uuid, owner_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select ph.id, ph.owner_id
    from public.pet_photos ph
   where ph.pet_id is null
     and ph.litter_id is null
     and (ph.released_at is not null or ph.staged_at <= now() - p_staged_ttl);
$$;

create or replace function public.delete_pet_photo_rows(p_ids uuid[])
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.pet_photos ph
   where ph.id = any (p_ids) and ph.pet_id is null and ph.litter_id is null;
$$;

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
     and ph.litter_id is null
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

-- Las crías no cambian de estado, no vencen ni se editan sueltas hasta #206 (R2): lo común es de su
-- camada, y cada función del ciclo de vida de un animal las rechaza.
create function private.reject_litter_young(p_pet uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.pets p where p.id = p_pet and p.litter_id is not null) then
    raise exception using errcode = 'P0001', message = 'litter_young';
  end if;
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

  perform private.reject_litter_young(p_pet);

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
     and (
       ph.pet_id = p_pet
       or (ph.pet_id is null and ph.litter_id is null and ph.released_at is null)
     );
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

  perform private.reject_litter_young(p_pet);

  v_photos := public.pet_photo_ids(p_owner, p_pet);
  delete from public.pets p where p.id = p_pet;

  return query select 'done', v_pet.code,
                      private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at),
                      v_photos;
end;
$$;

create or replace function public.create_pet_renewal_link(p_pet uuid, p_token_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.reject_litter_young(p_pet);
  insert into public.pet_renewal_links (token_hash, pet_id, expires_at)
  values (p_token_hash, p_pet, now() + private.pet_renewal_link_lifetime());
end;
$$;

-- Renovar y volver a publicar son acciones de esta función, y `renew_by_link` pasa por acá.
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
  published_at timestamptz,
  ended_marked_at timestamptz
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
  v_ended timestamptz;
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
                        null::timestamptz, null::timestamptz, null::timestamptz;
    return;
  end if;

  perform private.reject_litter_young(p_pet);

  v_from := private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at);

  if v_from = 'taken_down' then
    return query select 'taken_down', v_pet.code, v_pet.name, v_pet.sex, v_from, v_from,
                        v_pet.expires_at, v_pet.published_at, null::timestamptz;
    return;
  end if;

  if p_action = 'mark_adopted' then
    return query select 'changed', v_pet.code, v_pet.name, v_pet.sex, v_from, v_from,
                        v_pet.expires_at, v_pet.published_at, null::timestamptz;
    return;
  end if;

  case
    when p_action = 'mark_in_process' and v_from = 'available' then v_target := 'in_process';
    when p_action = 'mark_available' and v_from = 'in_process' then v_target := 'available';
    when p_action = 'pause' and v_from in ('available', 'in_process') then v_target := 'paused';
    when p_action = 'resume' and v_from = 'paused' then
      v_target := 'available';
      v_fresh := true;
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
          ('mark_in_process', 'in_process'), ('mark_available', 'available'), ('pause', 'paused')
        ) then 'already'
        else 'changed'
      end,
      v_pet.code, v_pet.name, v_pet.sex, v_from, v_from, v_pet.expires_at, v_pet.published_at,
      null::timestamptz;
    return;
  end if;

  if v_fresh and not public.identity_level_one(p_owner, p_pending_ttl) then
    return query select 'needs_verification', v_pet.code, v_pet.name, v_pet.sex, v_from, v_from,
                        v_pet.expires_at, v_pet.published_at, null::timestamptz;
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

  if v_republish then
    update public.adoptions d
       set ended_at = now()
     where d.pet_id = p_pet
       and d.ended_at is null
    returning case
                when d.kind = 'site' and d.adopter_id is not null and d.declined_at is null
                  then d.marked_at
              end into v_ended;
  end if;

  return query select 'done', v_pet.code, v_pet.name, v_pet.sex, v_from,
                      private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at),
                      v_pet.expires_at, v_pet.published_at, v_ended;
end;
$$;

-- La camada entra a la revisión entera (R8); sus crías no entran sueltas.
create or replace function private.pet_review_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.litter_id is null then
    insert into public.pet_reviews (pet_id, pending_kind, pending_since)
    values (new.id, 'new', now());
  end if;
  return null;
end;
$$;

-- A la vista: sin baja y con su publicador a la vista, como un animal (R5).
create function private.litter_is_shown(l public.litters)
returns boolean
language sql
stable
set search_path = ''
as $$
  select l.taken_down_at is null and private.pet_is_listed(l.owner_id);
$$;

-- Disponible, en esta historia, es toda cría de una camada a la vista; #206 lo cambia acá (R4).
create function private.litter_available_count(p_litter uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.pets p where p.litter_id = p_litter;
$$;

-- Publicar una camada y sus crías en una transacción (R6). Lo mismo dos veces es una camada: el
-- intento la encuentra. Cada cría nace con lo común copiado, disponible y sin vencimiento (R2); su
-- `key` queda como el intento de su fila. El orden de las crías es el del formulario, por eso cada
-- una toma la hora del reloj al insertarse.
create function public.publish_litter(
  p_owner uuid,
  p_attempt uuid,
  p_pending_ttl interval,
  p_staged_ttl interval,
  p_fields jsonb,
  p_photo_ids uuid[],
  p_young jsonb
)
returns table (litter_id uuid, code text, already boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_litter public.litters%rowtype;
  v_young_count integer := coalesce(jsonb_array_length(p_young), 0);
  v_all uuid[];
  v_ready integer;
  v_delivers date := (p_fields ->> 'delivers_from')::date;
  v_young jsonb;
  v_pet uuid;
begin
  perform public.lock_phone_account(p_owner);

  select * into v_litter from public.litters l
   where l.owner_id = p_owner and l.attempt_id = p_attempt;
  if found then
    return query select v_litter.id, v_litter.code, true;
    return;
  end if;

  if not public.identity_level_one(p_owner, p_pending_ttl) then
    raise exception using errcode = 'P0001', message = 'needs_verification';
  end if;

  if v_young_count not between 2 and 10 then
    raise exception using errcode = 'P0001', message = 'young_count';
  end if;

  if (select count(distinct lower(btrim(y ->> 'name'))) from jsonb_array_elements(p_young) y)
     <> v_young_count then
    raise exception using errcode = 'P0001', message = 'young_name_taken';
  end if;

  if v_delivers is not null and v_delivers < public.uruguay_today() then
    raise exception using errcode = 'P0001', message = 'delivery_date_past';
  end if;

  if coalesce(cardinality(p_photo_ids), 0) not between 1 and 5
     or exists (
       select 1 from jsonb_array_elements(p_young) y
        where jsonb_array_length(coalesce(y -> 'photo_ids', '[]'::jsonb)) > 5
     ) then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  v_all := p_photo_ids || coalesce(
    (select array_agg(x::uuid)
       from jsonb_array_elements(p_young) y,
            jsonb_array_elements_text(coalesce(y -> 'photo_ids', '[]'::jsonb)) x),
    '{}'
  );

  select count(distinct ph.id) into v_ready
    from public.pet_photos ph
   where ph.id = any (v_all)
     and ph.owner_id = p_owner
     and ph.pet_id is null
     and ph.litter_id is null
     and ph.released_at is null
     and ph.staged_at > now() - p_staged_ttl;
  if v_ready <> cardinality(v_all) then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  insert into public.litters (
    owner_id, attempt_id, name, species, age_value, age_unit, age_as_of, size, is_neutered,
    vaccines, has_chip, good_with_kids, good_with_dogs, good_with_cats, description, department,
    locality, is_urgent, required_level, delivers_from
  )
  values (
    p_owner, p_attempt, p_fields ->> 'name', p_fields ->> 'species',
    (p_fields ->> 'age_value')::smallint, p_fields ->> 'age_unit',
    (p_fields ->> 'age_as_of')::date, p_fields ->> 'size', (p_fields ->> 'is_neutered')::boolean,
    p_fields ->> 'vaccines', (p_fields ->> 'has_chip')::boolean, p_fields ->> 'good_with_kids',
    p_fields ->> 'good_with_dogs', p_fields ->> 'good_with_cats', p_fields ->> 'description',
    p_fields ->> 'department', p_fields ->> 'locality', (p_fields ->> 'is_urgent')::boolean,
    coalesce((p_fields ->> 'required_level')::smallint, 1), v_delivers
  )
  returning * into v_litter;

  update public.pet_photos ph
     set litter_id = v_litter.id, position = o.ord - 1
    from unnest(p_photo_ids) with ordinality as o (id, ord)
   where ph.id = o.id;

  for v_young in select y from jsonb_array_elements(p_young) y loop
    insert into public.pets (
      owner_id, attempt_id, litter_id, name, species, sex, age_value, age_unit, age_as_of, size,
      is_neutered, vaccines, has_chip, good_with_kids, good_with_dogs, good_with_cats,
      description, department, locality, is_urgent, required_level, published_at, expires_at
    )
    values (
      p_owner, (v_young ->> 'key')::uuid, v_litter.id, v_young ->> 'name', v_litter.species,
      v_young ->> 'sex', v_litter.age_value, v_litter.age_unit, v_litter.age_as_of, v_litter.size,
      v_litter.is_neutered, v_litter.vaccines, v_litter.has_chip, v_litter.good_with_kids,
      v_litter.good_with_dogs, v_litter.good_with_cats, v_young ->> 'description',
      v_litter.department, v_litter.locality, v_litter.is_urgent, v_litter.required_level,
      clock_timestamp(), 'infinity'
    )
    returning id into v_pet;

    update public.pet_photos ph
       set pet_id = v_pet, position = o.ord - 1
      from jsonb_array_elements_text(coalesce(v_young -> 'photo_ids', '[]'::jsonb))
           with ordinality as o (id, ord)
     where ph.id = o.id::uuid;
  end loop;

  return query select v_litter.id, v_litter.code, false;
end;
$$;

revoke all on function private.reject_litter_young(uuid) from public, anon, authenticated;
revoke all on function private.litter_is_shown(public.litters) from public, anon, authenticated;
revoke all on function private.litter_available_count(uuid) from public, anon, authenticated;
revoke all on function public.publish_litter(uuid, uuid, interval, interval, jsonb, uuid[], jsonb)
  from public, anon, authenticated;

grant execute on function public.publish_litter(uuid, uuid, interval, interval, jsonb, uuid[], jsonb)
  to service_role;

-- La ficha de la camada (US2) ----------------------------------------------------------------------

-- La portada de un animal; la de una cría sin fotos propias es la de su camada (FR-028). La usan el
-- cuestionario y «Mis solicitudes», que muestran la foto de lo que se pidió.
create function private.pet_cover(p public.pets)
returns setof public.pet_photos
language sql
stable
set search_path = ''
as $$
  select ph.*
    from public.pet_photos ph
   where ph.position = 0
     and (ph.pet_id = p.id or ph.litter_id = p.litter_id)
   order by ph.litter_id nulls first
   limit 1;
$$;

-- La forma de `pet_by_code` (R5): el bloqueo primero, la suspendida como inexistente, `hidden` para
-- quien publica sin nivel 1 hoy, y todo para la dueña. Suma sus crías, cada una con su código, lo
-- propio, sus fotos y, para quien mira, si ya la pidió o lo rechazaron por ella.
create function public.litter_by_code(p_code text)
returns table (
  visibility text,
  is_owner boolean,
  litter_id uuid,
  code text,
  name text,
  species text,
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
  required_level smallint,
  delivers_from date,
  published_at timestamptz,
  owner_folder uuid,
  photos jsonb,
  young jsonb,
  available_count integer,
  version text,
  publisher_name text,
  publisher_avatar_path text,
  publisher_is_rescuer boolean,
  publisher_level smallint,
  takedown_reason text,
  takedown_note text,
  publisher_public_id text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_litter public.litters%rowtype;
  v_visibility text;
  v_owner boolean;
  v_viewer uuid := (select auth.uid());
begin
  select * into v_litter from public.litters l where l.code = p_code;
  if not found then
    return;
  end if;

  v_owner := coalesce(v_viewer = v_litter.owner_id, false);

  if not v_owner and exists (
    select 1
      from public.blocks b
     where b.blocker_id = v_viewer
       and b.blocked_id = v_litter.owner_id
  ) then
    visibility := 'blocked';
    is_owner := false;
    publisher_public_id := (
      select pr.public_id from public.profiles pr where pr.id = v_litter.owner_id
    );
    return next;
    return;
  end if;

  if not v_owner and (
    private.is_suspended(v_litter.owner_id) or v_litter.taken_down_at is not null
  ) then
    return;
  end if;

  v_visibility := case when private.litter_is_shown(v_litter) then 'listed' else 'hidden' end;

  if not v_owner and v_visibility = 'hidden' then
    visibility := v_visibility;
    is_owner := false;
    return next;
    return;
  end if;

  return query
    select v_visibility,
           v_owner,
           case when v_owner then v_litter.id end,
           v_litter.code, v_litter.name, v_litter.species, v_litter.age_value, v_litter.age_unit,
           v_litter.age_as_of, v_litter.size, v_litter.is_neutered, v_litter.vaccines,
           v_litter.has_chip, v_litter.good_with_kids, v_litter.good_with_dogs,
           v_litter.good_with_cats, v_litter.description, v_litter.department, v_litter.locality,
           v_litter.is_urgent, v_litter.required_level, v_litter.delivers_from,
           v_litter.published_at, v_litter.owner_id,
           coalesce(
             (select jsonb_agg(
                       jsonb_build_object(
                         'id', ph.id, 'width', ph.width, 'height', ph.height,
                         'thumbhash', ph.thumbhash
                       ) order by ph.position
                     )
                from public.pet_photos ph
               where ph.litter_id = v_litter.id),
             '[]'::jsonb
           ),
           coalesce(
             (select jsonb_agg(
                       jsonb_build_object(
                         'code', y.code,
                         'name', y.name,
                         'sex', y.sex,
                         'description', y.description,
                         'photos', coalesce(
                           (select jsonb_agg(
                                     jsonb_build_object(
                                       'id', ph.id, 'width', ph.width, 'height', ph.height,
                                       'thumbhash', ph.thumbhash
                                     ) order by ph.position
                                   )
                              from public.pet_photos ph
                             where ph.pet_id = y.id),
                           '[]'::jsonb
                         ),
                         'my_active_id', (
                           select a.id
                             from public.applications a
                            where a.applicant_id = v_viewer
                              and a.pet_id = y.id
                              and a.status in ('sent', 'accepted')
                         ),
                         'my_rejected', exists (
                           select 1
                             from public.applications a
                            where a.applicant_id = v_viewer
                              and a.pet_id = y.id
                              and a.status = 'rejected'
                         )
                       ) order by y.published_at
                     )
                from public.pets y
               where y.litter_id = v_litter.id),
             '[]'::jsonb
           ),
           private.litter_available_count(v_litter.id),
           private.pet_share_version(
             (select ph.id from public.pet_photos ph
               where ph.litter_id = v_litter.id and ph.position = 0),
             v_litter.name, v_litter.department, v_litter.locality, false
           ),
           pr.display_name, pr.avatar_path, pr.is_rescuer,
           case
             when v_visibility = 'listed' then private.publisher_level(v_litter.owner_id)
           end,
           case when v_owner then v_litter.takedown_reason end,
           case when v_owner then v_litter.takedown_note end,
           null::text
      from (select 1) as one
      left join public.profiles pr on pr.id = v_litter.owner_id;
end;
$$;

-- La vista previa, igual para todos: la portada, el nombre y la zona de una camada a la vista; de
-- cualquier otra, nada (FR-036).
create function public.litter_share_card(p_code text)
returns table (
  name text,
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
  select l.name, l.department, l.locality, ph.id, ph.owner_id, ph.width, ph.height,
         private.pet_share_version(ph.id, l.name, l.department, l.locality, false)
    from public.litters l
    join public.pet_photos ph on ph.litter_id = l.id and ph.position = 0
   where l.code = p_code
     and private.litter_is_shown(l);
$$;

-- Las fotos de lo que está a la vista: ahora también las de una camada. Las de una cría ya entraban
-- como las de un animal, porque la cría lleva copiada la baja de su camada (R5).
create or replace function private.pet_photo_object_listed(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with parts as (select storage.foldername(object_name) as folder),
  photo as (
    select ph.*
      from parts
      join public.pet_photos ph
        on parts.folder[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and ph.id = parts.folder[2]::uuid
       and ph.owner_id::text = parts.folder[1]
  )
  select exists (
           select 1 from photo join public.pets p on p.id = photo.pet_id
            where private.pet_is_shown(p)
         )
      or exists (
           select 1 from photo join public.litters l on l.id = photo.litter_id
            where private.litter_is_shown(l)
         );
$$;

-- Suma `litter_code`: el enlace de una cría lleva a la ficha de su camada (R3). Cambia el tipo de
-- retorno, así que se borra y se recrea.
drop function public.pet_by_code(text);

create function public.pet_by_code(p_code text)
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
  takedown_note text,
  publisher_public_id text,
  litter_code text
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

  -- Una cría no tiene ficha propia (FR-034): solo el código de su camada, cuya ficha decide qué ve
  -- cada uno con las mismas reglas.
  if v_pet.litter_id is not null then
    visibility := 'young';
    is_owner := false;
    litter_code := (select l.code from public.litters l where l.id = v_pet.litter_id);
    return next;
    return;
  end if;

  v_state := private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at);
  v_owner := coalesce((select auth.uid()) = v_pet.owner_id, false);

  if not v_owner and exists (
    select 1
      from public.blocks b
     where b.blocker_id = (select auth.uid())
       and b.blocked_id = v_pet.owner_id
  ) then
    visibility := 'blocked';
    is_owner := false;
    publisher_public_id := (select pr.public_id from public.profiles pr where pr.id = v_pet.owner_id);
    return next;
    return;
  end if;

  if not v_owner and private.is_suspended(v_pet.owner_id) then
    return;
  end if;

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
             v_pet.name, v_pet.department, v_pet.locality, v_pet.status = 'adopted'
           ),
           pr.display_name, pr.avatar_path, pr.is_rescuer,
           case
             when v_visibility in ('listed', 'adopted') then private.publisher_level(v_pet.owner_id)
           end,
           case when v_owner then v_pet.takedown_reason end,
           case when v_owner then v_pet.takedown_note end,
           null::text,
           null::text
      from (select 1) as one
      left join public.profiles pr on pr.id = v_pet.owner_id;
end;
$$;

-- El cuestionario y «Mis solicitudes» con la portada de la camada para una cría sin fotos propias.
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
    left join lateral private.pet_cover(p) ph on true
    left join public.profiles pr on pr.id = p.owner_id
   where p.id = p_pet;
$$;


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
    left join lateral private.pet_cover(p) ph on true
   where p.code = p_code;
$$;

revoke all on function private.pet_cover(public.pets) from public, anon, authenticated;
revoke all on function public.litter_by_code(text) from public, anon, authenticated;
revoke all on function public.litter_share_card(text) from public, anon, authenticated;
revoke all on function public.pet_by_code(text) from public, anon, authenticated;

grant execute on function public.litter_by_code(text) to anon, authenticated;
grant execute on function public.litter_share_card(text) to anon, authenticated;
grant execute on function public.pet_by_code(text) to anon, authenticated;

-- El listado (US3) --------------------------------------------------------------------------------

-- Una camada es una fila entre los animales sueltos (R4), con `kind`, `young_count` y
-- `available_count`; sus crías no salen sueltas. En una camada el sexo es null: el filtro de sexo
-- pide una cría de ese sexo, y los demás filtros miran lo común. Disponible es lo mismo que en
-- `litter_available_count`: toda cría que existe; #206 cambia los dos.
drop function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
);

create function public.listed_pets(
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
  kind text,
  code text,
  name text,
  species text,
  sex text,
  size text,
  age_value smallint,
  age_unit text,
  age_as_of date,
  department text,
  locality text,
  is_urgent boolean,
  status text,
  published_at timestamptz,
  young_count integer,
  available_count integer,
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
  with today as (select public.uruguay_today() as day),
  shown as (
    select 'pet'::text as kind, p.code, p.name, p.species, p.sex, p.size, p.age_value, p.age_unit,
           p.age_as_of, p.department, p.locality, p.is_urgent, p.is_neutered, p.status,
           p.published_at, p.owner_id, null::integer as young_count,
           null::integer as available_count, ph.id as cover_id, ph.owner_id as cover_owner,
           ph.width, ph.height, ph.thumbhash
      from public.pets p
      join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
     where p.litter_id is null
       and p.status in ('available', 'in_process')
       and p.taken_down_at is null
       and p.expires_at > now()
       and private.pet_is_listed(p.owner_id)
       and (coalesce(cardinality(p_sexes), 0) = 0 or p.sex = any (p_sexes))
    union all
    select 'litter', l.code, l.name, l.species, null, l.size, l.age_value, l.age_unit,
           l.age_as_of, l.department, l.locality, l.is_urgent, l.is_neutered, 'available',
           l.published_at, l.owner_id,
           (select count(*)::integer from public.pets y where y.litter_id = l.id),
           private.litter_available_count(l.id), ph.id, ph.owner_id, ph.width, ph.height,
           ph.thumbhash
      from public.litters l
      join public.pet_photos ph on ph.litter_id = l.id and ph.position = 0
     where private.litter_is_shown(l)
       and (
         coalesce(cardinality(p_sexes), 0) = 0
         or exists (
           select 1 from public.pets y where y.litter_id = l.id and y.sex = any (p_sexes)
         )
       )
  )
  select s.kind, s.code, s.name, s.species, s.sex, s.size, s.age_value, s.age_unit, s.age_as_of,
         s.department, s.locality, s.is_urgent, s.status, s.published_at, s.young_count,
         s.available_count, s.cover_id, s.cover_owner, s.width, s.height, s.thumbhash,
         count(*) over ()
    from shown s
    cross join today
   where not exists (
           select 1
             from public.blocks b
            where b.blocker_id = (select auth.uid())
              and b.blocked_id = s.owner_id
         )
     and (coalesce(cardinality(p_species), 0) = 0 or s.species = any (p_species))
     and (coalesce(cardinality(p_sizes), 0) = 0 or s.size = any (p_sizes))
     and (coalesce(cardinality(p_departments), 0) = 0 or s.department = any (p_departments))
     and (not coalesce(p_neutered_only, false) or s.is_neutered)
     and (
       coalesce(cardinality(p_age_bands), 0) = 0
       or private.pet_age_months(s.age_value, s.age_unit, s.age_as_of, today.day)
          <@ any (p_age_bands)
     )
     and (p_after_published is null or (s.published_at, s.code) < (p_after_published, p_after_code))
   order by s.published_at desc, s.code desc
   limit least(greatest(coalesce(p_limit, 25), 1), 241);
$$;

revoke all on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
) from public, anon, authenticated;

grant execute on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
) to anon, authenticated;

-- Editar la camada (US4) ---------------------------------------------------------------------------

-- Guardar la camada en una transacción (R6): lo común en la camada y copiado a cada cría, cada cría
-- con lo suyo, las nuevas creadas y las que no vienen, borradas. Una cría que ya existía viene con
-- su `id`; una nueva, con su `key`, que queda como su intento: un reintento la encuentra y no la
-- repite (FR-016). Borrar una cría cierra sus solicitudes con el trigger de #63 (FR-019). Las fotos
-- que ya no están, de la camada o de una cría quitada, quedan sueltas y la acción las borra (o la
-- purga). La fecha de entrega se controla solo si cambió (FR-013).
create function public.save_litter(
  p_owner uuid,
  p_litter uuid,
  p_pending_ttl interval,
  p_staged_ttl interval,
  p_fields jsonb,
  p_photo_ids uuid[],
  p_young jsonb
)
returns table (code text, released uuid[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_litter public.litters%rowtype;
  v_young_count integer := coalesce(jsonb_array_length(p_young), 0);
  v_delivers date := (p_fields ->> 'delivers_from')::date;
  v_all uuid[];
  v_kept uuid[];
  v_known integer;
  v_released uuid[];
  v_young jsonb;
  v_pet uuid;
begin
  perform public.lock_phone_account(p_owner);

  select * into v_litter from public.litters l
   where l.id = p_litter and l.owner_id = p_owner
   for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  if v_litter.taken_down_at is not null then
    raise exception using errcode = 'P0001', message = 'taken_down';
  end if;

  if not public.identity_level_one(p_owner, p_pending_ttl) then
    raise exception using errcode = 'P0001', message = 'needs_verification';
  end if;

  if v_young_count not between 1 and 10 then
    raise exception using errcode = 'P0001', message = 'young_count';
  end if;

  if (select count(distinct lower(btrim(y ->> 'name'))) from jsonb_array_elements(p_young) y)
     <> v_young_count then
    raise exception using errcode = 'P0001', message = 'young_name_taken';
  end if;

  if v_delivers is distinct from v_litter.delivers_from
     and v_delivers < public.uruguay_today() then
    raise exception using errcode = 'P0001', message = 'delivery_date_past';
  end if;

  if coalesce(cardinality(p_photo_ids), 0) not between 1 and 5
     or exists (
       select 1 from jsonb_array_elements(p_young) y
        where jsonb_array_length(coalesce(y -> 'photo_ids', '[]'::jsonb)) > 5
     ) then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  v_all := p_photo_ids || coalesce(
    (select array_agg(x::uuid)
       from jsonb_array_elements(p_young) y,
            jsonb_array_elements_text(coalesce(y -> 'photo_ids', '[]'::jsonb)) x),
    '{}'
  );
  if (select count(distinct x) from unnest(v_all) as x) <> cardinality(v_all) then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  -- Una cría de la pantalla que ya no está en la camada: otra pestaña la quitó, y guardar ahora la
  -- haría volver.
  if exists (
    select 1 from jsonb_array_elements(p_young) y
     where y ->> 'id' is not null
       and not exists (
         select 1 from public.pets p where p.litter_id = p_litter and p.id::text = y ->> 'id'
       )
  ) then
    raise exception using errcode = 'P0001', message = 'changed_elsewhere';
  end if;

  select coalesce(array_agg(p.id), '{}') into v_kept
    from public.pets p
   where p.litter_id = p_litter
     and exists (
       select 1 from jsonb_array_elements(p_young) y
        where p.id::text = y ->> 'id' or p.attempt_id::text = y ->> 'key'
     );

  -- Como al guardar un animal: cada foto de la pantalla es de esta camada, de una cría que sigue o
  -- está en espera; si no, otra pestaña la sacó.
  select count(*) into v_known
    from public.pet_photos ph
   where ph.id = any (v_all)
     and ph.owner_id = p_owner
     and (
       ph.litter_id = p_litter
       or ph.pet_id = any (v_kept)
       or (ph.pet_id is null and ph.litter_id is null and ph.released_at is null)
     );
  if v_known <> cardinality(v_all) then
    raise exception using errcode = 'P0001', message = 'changed_elsewhere';
  end if;

  if exists (
    select 1 from public.pet_photos ph
     where ph.id = any (v_all)
       and ph.pet_id is null
       and ph.litter_id is null
       and ph.staged_at <= now() - p_staged_ttl
  ) then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  with freed as (
    update public.pet_photos ph
       set pet_id = null, litter_id = null, position = null, released_at = now()
     where (
         ph.litter_id = p_litter
         or ph.pet_id in (select p.id from public.pets p where p.litter_id = p_litter)
       )
       and ph.id <> all (v_all)
    returning ph.id
  )
  select coalesce(array_agg(f.id), '{}') into v_released from freed f;

  delete from public.pets p where p.litter_id = p_litter and p.id <> all (v_kept);

  update public.litters l
     set name = p_fields ->> 'name',
         species = p_fields ->> 'species',
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
         required_level = coalesce((p_fields ->> 'required_level')::smallint, 1),
         delivers_from = v_delivers
   where l.id = p_litter
  returning * into v_litter;

  -- Revisada y editada vuelve a la lista (FR-045); si todavía espera, sigue como estaba, como un
  -- animal en `save_pet`.
  insert into public.pet_reviews as r (litter_id, pending_kind, pending_since)
  values (p_litter, 'edited', now())
  on conflict (litter_id) do update
    set pending_kind = 'edited', pending_since = now()
    where r.pending_kind is null;

  update public.pet_photos ph
     set litter_id = p_litter, pet_id = null, position = o.ord - 1
    from unnest(p_photo_ids) with ordinality as o (id, ord)
   where ph.id = o.id;

  for v_young in select y from jsonb_array_elements(p_young) y loop
    select p.id into v_pet
      from public.pets p
     where p.litter_id = p_litter
       and (p.id::text = v_young ->> 'id' or p.attempt_id::text = v_young ->> 'key');

    if v_pet is null then
      insert into public.pets (
        owner_id, attempt_id, litter_id, name, species, sex, age_value, age_unit, age_as_of, size,
        is_neutered, vaccines, has_chip, good_with_kids, good_with_dogs, good_with_cats,
        description, department, locality, is_urgent, required_level, published_at, expires_at
      )
      values (
        p_owner, (v_young ->> 'key')::uuid, p_litter, v_young ->> 'name', v_litter.species,
        v_young ->> 'sex', v_litter.age_value, v_litter.age_unit, v_litter.age_as_of,
        v_litter.size, v_litter.is_neutered, v_litter.vaccines, v_litter.has_chip,
        v_litter.good_with_kids, v_litter.good_with_dogs, v_litter.good_with_cats,
        v_young ->> 'description', v_litter.department, v_litter.locality, v_litter.is_urgent,
        v_litter.required_level, clock_timestamp(), 'infinity'
      )
      returning id into v_pet;
    else
      update public.pets p
         set name = v_young ->> 'name',
             sex = v_young ->> 'sex',
             description = v_young ->> 'description',
             species = v_litter.species,
             age_value = v_litter.age_value,
             age_unit = v_litter.age_unit,
             age_as_of = v_litter.age_as_of,
             size = v_litter.size,
             is_neutered = v_litter.is_neutered,
             vaccines = v_litter.vaccines,
             has_chip = v_litter.has_chip,
             good_with_kids = v_litter.good_with_kids,
             good_with_dogs = v_litter.good_with_dogs,
             good_with_cats = v_litter.good_with_cats,
             department = v_litter.department,
             locality = v_litter.locality,
             is_urgent = v_litter.is_urgent,
             required_level = v_litter.required_level
       where p.id = v_pet;
    end if;

    update public.pet_photos ph
       set pet_id = v_pet, litter_id = null, position = o.ord - 1
      from jsonb_array_elements_text(coalesce(v_young -> 'photo_ids', '[]'::jsonb))
           with ordinality as o (id, ord)
     where ph.id = o.id::uuid;
  end loop;

  return query select v_litter.code, v_released;
end;
$$;

-- Cuántas solicitudes abiertas tienen las crías que se van a quitar, para decirlo antes de guardar
-- (FR-019). Solo de una camada de quien pregunta: de otra, cero.
create function public.preview_litter_removal(p_litter uuid, p_ids uuid[])
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
    from public.applications a
    join public.pets p on p.id = a.pet_id
    join public.litters l on l.id = p.litter_id
   where l.id = p_litter
     and l.owner_id = (select auth.uid())
     and p.id = any (p_ids)
     and a.status in ('sent', 'accepted');
$$;

-- Quitar la última cría borra la camada entera (FR-020): sus crías caen por la cascada y cierran sus
-- solicitudes con el trigger de #63; sus fotos quedan sueltas y la acción las borra (o la purga).
create function public.delete_litter(p_owner uuid, p_litter uuid)
returns table (outcome text, code text, released uuid[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_litter public.litters%rowtype;
  v_released uuid[];
begin
  perform public.lock_phone_account(p_owner);

  select * into v_litter from public.litters l
   where l.id = p_litter and l.owner_id = p_owner
   for update;
  if not found then
    return query select 'not_found', null::text, '{}'::uuid[];
    return;
  end if;

  with freed as (
    update public.pet_photos ph
       set pet_id = null, litter_id = null, position = null, released_at = now()
     where ph.litter_id = p_litter
        or ph.pet_id in (select p.id from public.pets p where p.litter_id = p_litter)
    returning ph.id
  )
  select coalesce(array_agg(f.id), '{}') into v_released from freed f;

  delete from public.litters l where l.id = p_litter;

  return query select 'done', v_litter.code, v_released;
end;
$$;

revoke all on function public.save_litter(uuid, uuid, interval, interval, jsonb, uuid[], jsonb)
  from public, anon, authenticated;
revoke all on function public.preview_litter_removal(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.delete_litter(uuid, uuid) from public, anon, authenticated;

grant execute on function public.save_litter(uuid, uuid, interval, interval, jsonb, uuid[], jsonb)
  to service_role;
grant execute on function public.preview_litter_removal(uuid, uuid[]) to authenticated;
grant execute on function public.delete_litter(uuid, uuid) to service_role;

-- La revisión de quien administra (US5) -------------------------------------------------------------

-- La camada entra a la lista entera en el momento en que sale a la vista (FR-043).
create function private.litter_review_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.pet_reviews (litter_id, pending_kind, pending_since)
  values (new.id, 'new', now());
  return null;
end;
$$;

create trigger litters_review_on_insert
  after insert on public.litters
  for each row execute function private.litter_review_on_insert();

-- La única definición de «espera revisión», para un animal y para una camada: la lista, su cuenta y
-- el inicio de Administrar la leen de acá (R8).
create function private.waiting_reviews()
returns table (
  pet_id uuid,
  litter_id uuid,
  owner_id uuid,
  name text,
  pending_kind text,
  pending_since timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, null::uuid, p.owner_id, p.name, r.pending_kind, r.pending_since
    from public.pet_reviews r
    join public.pets p on p.id = r.pet_id
   where r.pending_since is not null
     and p.taken_down_at is null
     and not private.is_suspended(p.owner_id)
  union all
  select null::uuid, l.id, l.owner_id, l.name, r.pending_kind, r.pending_since
    from public.pet_reviews r
    join public.litters l on l.id = r.litter_id
   where r.pending_since is not null
     and l.taken_down_at is null
     and not private.is_suspended(l.owner_id);
$$;

-- Las fotos de un animal, de una cría o de una camada, en orden, como las lee la pantalla.
create function private.review_photos(p_pet uuid, p_litter uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', ph.id, 'width', ph.width, 'height', ph.height, 'thumbhash', ph.thumbhash
      ) order by ph.position
    ),
    '[]'::jsonb
  )
    from public.pet_photos ph
   where ph.pet_id = p_pet or ph.litter_id = p_litter;
$$;

-- Suma `kind`, `litter_id` y `young`: una camada es una fila con lo común, sus fotos y sus crías con
-- lo suyo (FR-043). En una camada el sexo es null: lo dice cada cría. Cambia el tipo de retorno, así
-- que se borra y se recrea.
drop function public.pet_review_queue(integer);

create function public.pet_review_queue(p_limit integer)
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
  publisher_public_id text,
  total bigint,
  others bigint,
  kind text,
  litter_id uuid,
  young jsonb
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
    select w.pet_id, s.code, s.name, s.species, s.sex, s.age_value, s.age_unit, s.age_as_of,
           s.size, s.is_neutered, s.vaccines, s.has_chip, s.good_with_kids, s.good_with_dogs,
           s.good_with_cats, s.description, s.department, s.locality, s.is_urgent, s.state,
           w.pending_kind, w.pending_since,
           w.owner_id = (select auth.uid()),
           w.owner_id,
           s.photos,
           pr.display_name, pr.avatar_path, pr.is_rescuer,
           -- Sin nivel 1 no hay escalera: la pantalla lo dice en palabras.
           case when private.pet_is_listed(w.owner_id) then private.publisher_level(w.owner_id) end,
           pr.public_id,
           count(*) over (),
           count(*) filter (where w.owner_id <> (select auth.uid())) over (),
           s.kind,
           w.litter_id,
           s.young
      from private.waiting_reviews() w
      cross join lateral (
        select 'pet'::text as kind, p.code, p.name, p.species, p.sex, p.age_value, p.age_unit,
               p.age_as_of, p.size, p.is_neutered, p.vaccines, p.has_chip, p.good_with_kids,
               p.good_with_dogs, p.good_with_cats, p.description, p.department, p.locality,
               p.is_urgent, private.pet_state(p.status, p.expires_at, p.taken_down_at) as state,
               private.review_photos(p.id, null) as photos,
               null::jsonb as young
          from public.pets p
         where p.id = w.pet_id
        union all
        -- Una camada que espera está a la vista: su estado es el de un animal disponible.
        select 'litter', l.code, l.name, l.species, null::text, l.age_value, l.age_unit,
               l.age_as_of, l.size, l.is_neutered, l.vaccines, l.has_chip, l.good_with_kids,
               l.good_with_dogs, l.good_with_cats, l.description, l.department, l.locality,
               l.is_urgent, 'available',
               private.review_photos(null, l.id),
               coalesce(
                 (select jsonb_agg(
                           jsonb_build_object(
                             'id', y.id, 'name', y.name, 'sex', y.sex,
                             'description', y.description,
                             'photos', private.review_photos(y.id, null)
                           ) order by y.published_at, y.id
                         )
                    from public.pets y
                   where y.litter_id = l.id),
                 '[]'::jsonb
               )
          from public.litters l
         where l.id = w.litter_id
      ) s
      left join public.profiles pr on pr.id = w.owner_id
     order by w.pending_since, coalesce(w.pet_id, w.litter_id)
     limit least(greatest(coalesce(p_limit, 20), 1), 100);
end;
$$;

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
               from private.waiting_reviews() w
              where w.owner_id <> (select auth.uid())
           )
           else 0
         end;
$$;

-- El inicio de Administrar, el menú y el resumen cuentan la camada como una publicación (#191).
create or replace function private.admin_queue_rows(p_admin uuid)
returns table (queue text, since timestamptz, is_own boolean, pet_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select 'identity', r.sent_at, r.user_id = p_admin, null::text
    from public.identity_requests r
   where r.expires_at > now()
  union all
  select 'pets', w.pending_since, w.owner_id = p_admin, w.name
    from private.waiting_reviews() w
  union all
  -- La reportada sin perfil no está en Reportes (`report_queue` la une con `profiles`).
  select 'reports', r.created_at, r.reported_id = p_admin, null::text
    from public.reports r
    join public.profiles t on t.id = r.reported_id
   where r.resolved_at is null;
$$;

-- Resolver una camada, con las reglas de `resolve_pet_review` (FR-044). La baja se escribe en la
-- camada y en cada cría: así `pet_is_shown` y pedir las ven dadas de baja, y el trigger de #63 cierra
-- las solicitudes abiertas de cada una como las de un animal dado de baja (R8).
create function public.resolve_litter_review(
  p_admin uuid,
  p_litter uuid,
  p_known_since timestamptz,
  p_outcome text,
  p_reason text default null,
  p_note text default null
)
returns table (
  decision text,
  owner_id uuid,
  litter_name text,
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
  v_litter public.litters%rowtype;
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

  select l.owner_id into v_owner from public.litters l where l.id = p_litter;
  if v_owner is null then
    decision := 'gone';
    return next;
    return;
  end if;

  perform public.lock_phone_account(v_owner);

  select * into v_litter from public.litters l where l.id = p_litter for update;
  if not found then
    decision := 'gone';
    return next;
    return;
  end if;
  if v_litter.owner_id = p_admin then
    decision := 'own';
    return next;
    return;
  end if;

  select * into v_review from public.pet_reviews r where r.litter_id = p_litter for update;
  if v_review.pending_since is null
     or v_review.pending_since <> p_known_since
     or v_litter.taken_down_at is not null then
    decision := 'closed';
    return next;
    return;
  end if;

  if p_outcome = 'taken_down' then
    update public.litters l
       set taken_down_at = now(),
           takedown_reason = p_reason,
           takedown_note = btrim(p_note)
     where l.id = p_litter;

    update public.pets p
       set taken_down_at = now(),
           takedown_reason = p_reason,
           takedown_note = btrim(p_note),
           status_changed_at = now()
     where p.litter_id = p_litter;
  end if;

  update public.pet_reviews r
     set pending_kind = null,
         pending_since = null,
         resolved_at = now(),
         resolved_by = p_admin,
         outcome = p_outcome
   where r.litter_id = p_litter;

  return query select p_outcome, v_litter.owner_id, v_litter.name, v_litter.code,
                      v_review.pending_kind, v_review.pending_since;
end;
$$;

-- Las fotos de lo que espera, para quien administra: las de un animal, las de una camada y las de
-- sus crías, solo mientras espera (FR-043).
create or replace function private.pet_photo_object_in_review(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with parts as (select storage.foldername(object_name) as folder),
  photo as (
    select ph.pet_id, coalesce(ph.litter_id, p.litter_id) as litter_id
      from parts
      join public.pet_photos ph
        on parts.folder[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and ph.id = parts.folder[2]::uuid
       and ph.owner_id::text = parts.folder[1]
      left join public.pets p on p.id = ph.pet_id
  )
  select exists (
    select 1
      from photo
      join public.pet_reviews r on r.pet_id = photo.pet_id or r.litter_id = photo.litter_id
      left join public.pets p on p.id = r.pet_id
      left join public.litters l on l.id = r.litter_id
     where r.pending_since is not null
       and coalesce(p.taken_down_at, l.taken_down_at) is null
       and not private.is_suspended(coalesce(p.owner_id, l.owner_id))
  );
$$;

revoke all on function private.litter_review_on_insert() from public, anon, authenticated;
revoke all on function private.waiting_reviews() from public, anon, authenticated;
revoke all on function private.review_photos(uuid, uuid) from public, anon, authenticated;
revoke all on function public.pet_review_queue(integer) from public, anon, authenticated;
revoke all on function public.resolve_litter_review(uuid, uuid, timestamptz, text, text, text)
  from public, anon, authenticated;

grant execute on function public.pet_review_queue(integer) to authenticated;
grant execute on function public.resolve_litter_review(uuid, uuid, timestamptz, text, text, text)
  to service_role;
