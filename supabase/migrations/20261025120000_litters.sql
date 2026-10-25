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
