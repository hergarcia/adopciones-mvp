-- Los animales publicados (historia #53). Como el teléfono, toda escritura pasa por funciones con el
-- candado de la cuenta y el nivel 1 comprobado adentro: publicar con fotos son varias escrituras que
-- tienen que ser una, y dos toques o un reintento en paralelo tienen que chocar acá y no en la
-- aplicación. Los números de las reglas llegan como parámetros desde `lib/pets/rules.ts` y
-- `lib/verification/rules.ts`, que son su única fuente.

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  attempt_id uuid not null,
  name text not null,
  species text not null,
  sex text not null,
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
  status text not null default 'available',
  language text not null default 'es',
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pets_attempt_unique unique (owner_id, attempt_id),
  constraint pets_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint pets_species_valid check (species in ('dog', 'cat')),
  constraint pets_sex_valid check (sex in ('male', 'female')),
  constraint pets_age_unit_valid check (age_unit in ('months', 'years')),
  constraint pets_age_range check (
    (age_unit = 'months' and age_value between 1 and 11)
    or (age_unit = 'years' and age_value between 1 and 25)
  ),
  constraint pets_size_valid check (size in ('small', 'medium', 'large')),
  constraint pets_vaccines_valid check (vaccines in ('up_to_date', 'incomplete', 'none')),
  constraint pets_good_with_kids_valid check (good_with_kids in ('yes', 'no', 'unknown')),
  constraint pets_good_with_dogs_valid check (good_with_dogs in ('yes', 'no', 'unknown')),
  constraint pets_good_with_cats_valid check (good_with_cats in ('yes', 'no', 'unknown')),
  constraint pets_description_length check (
    description is null or char_length(description) <= 8000
  ),
  constraint pets_department_valid check (
    department in (
      'UY-AR', 'UY-CA', 'UY-CL', 'UY-CO', 'UY-DU', 'UY-FS', 'UY-FD', 'UY-LA', 'UY-MA',
      'UY-MO', 'UY-PA', 'UY-RV', 'UY-RO', 'UY-RN', 'UY-SA', 'UY-SJ', 'UY-SO', 'UY-TA', 'UY-TT'
    )
  ),
  constraint pets_locality_length check (char_length(btrim(locality)) between 1 and 60),
  constraint pets_status_valid check (status in ('available')),
  constraint pets_language_valid check (language in ('es'))
);

comment on table public.pets is
  'Un animal publicado. En la historia #53 lo ve solo su dueña (FR-005): la historia que hace '
  'públicas las fichas ensancha la policy de lectura con una condición explícita.';

comment on column public.pets.attempt_id is
  'La carga en una pestaña que publicó este animal. Único por dueña: dos toques, un reintento o '
  'una respuesta perdida terminan en la misma publicación (FR-018).';

comment on column public.pets.name is
  'El techo es de 120 puntos de código y no de 30: un emoji compuesto son varios puntos de código. '
  'Los 30 caracteres de la regla los cuenta el schema en grafemas (lib/schemas/pet.ts).';

comment on column public.pets.age_value is
  'La edad del día age_as_of. Se muestra avanzada desde ahí (lib/pets/age.ts), sin que ningún '
  'proceso actualice la fila (FR-010).';

comment on column public.pets.age_as_of is
  'El día de Uruguay desde el que avanza la edad. Lo calcula la aplicación: current_date corre en '
  'UTC y a la noche daría el día siguiente.';

comment on column public.pets.status is
  'Siempre available en esta historia; la del ciclo de vida ensancha el check (FR-012).';

comment on column public.pets.language is
  'El idioma de lo que escribió la persona (docs/06 §Qué NO se traduce).';

create index pets_owner_published_idx on public.pets (owner_id, published_at desc);

create trigger pets_touch_updated_at
  before update on public.pets
  for each row execute function public.touch_updated_at();

create table public.pet_photos (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete cascade,
  position smallint,
  width smallint not null,
  height smallint not null,
  thumbhash text not null,
  staged_at timestamptz not null default now(),
  released_at timestamptz,

  constraint pet_photos_position_range check (position between 0 and 4),
  constraint pet_photos_attached_has_position check ((pet_id is null) = (position is null)),
  constraint pet_photos_released_detached check (released_at is null or pet_id is null),
  constraint pet_photos_size_positive check (width > 0 and height > 0),
  constraint pet_photos_thumbhash_length check (char_length(thumbhash) between 1 and 64),
  -- Diferida: reordenar las fotos de un animal mueve varias posiciones en una sola sentencia, y a
  -- mitad de camino dos fotos comparten un lugar.
  constraint pet_photos_position_unique unique (pet_id, position) deferrable initially deferred
);

comment on table public.pet_photos is
  'Las fotos de un animal. El id lo genera el navegador y es también la carpeta de sus tres '
  'objetos en pet-photos/{owner_id}/{id}/. Sin pet_id es una foto en espera (subida para un '
  'intento que todavía no publicó) o soltada (la sacó un guardado): la purga borra las dos.';

comment on column public.pet_photos.position is
  '0 es la portada.';

create index pet_photos_owner_idx on public.pet_photos (owner_id);
create index pet_photos_pet_idx on public.pet_photos (pet_id) where pet_id is not null;

alter table public.pets enable row level security;
alter table public.pet_photos enable row level security;

create policy pets_select_own on public.pets
  for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy pet_photos_select_own on public.pet_photos
  for select to authenticated
  using ((select auth.uid()) = owner_id);

-- Sin policies de escritura, y sin permisos: una publicación escrita desde el cliente se saltearía
-- el nivel 1, las fotos en espera y el intento (FR-001, FR-015, FR-018).
revoke all on public.pets from anon, authenticated;
revoke all on public.pet_photos from anon, authenticated;
grant select on public.pets to authenticated;
grant select on public.pet_photos to authenticated;

-- Privado, como avatars: la historia que hace públicas las fichas decide cómo se ven las fotos de
-- una publicación disponible. Los límites son los de cada archivo que se guarda, ya procesado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-photos', 'pet-photos', false, 1048576, array['image/webp'])
on conflict (id) do nothing;

-- Solo leer, y solo la carpeta propia: es lo que hace falta para firmar las URLs con la sesión. Sube
-- y borra únicamente el servicio, después de anotar la fila, así no hay objetos sin fila que la
-- purga o el borrado de la cuenta no encuentren, ni subidas que se salteen el nivel 1.
create policy pet_photos_objects_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pet-photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- Nivel 1: teléfono verificado y ningún número a medias vivo. Es la misma regla que `phoneStatus` +
-- `isLevelOne` en lib/verification/phone-status.ts; si cambia una, cambia la otra.
create or replace function public.has_level_one(p_user uuid, p_pending_ttl interval)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.phones p
     where p.user_id = p_user
       and p.verified_number is not null
       and (p.pending_since is null or p.pending_since <= now() - p_pending_ttl)
  );
$$;

create or replace function public.stage_pet_photo(
  p_owner uuid,
  p_photo_id uuid,
  p_width smallint,
  p_height smallint,
  p_thumbhash text,
  p_pending_ttl interval
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  perform public.lock_phone_account(p_owner);

  if not public.has_level_one(p_owner, p_pending_ttl) then
    raise exception using errcode = 'P0001', message = 'needs_verification';
  end if;

  insert into public.pet_photos (id, owner_id, width, height, thumbhash)
  values (p_photo_id, p_owner, p_width, p_height, p_thumbhash)
  on conflict (id) do nothing;

  select ph.owner_id into v_owner from public.pet_photos ph where ph.id = p_photo_id;
  if v_owner <> p_owner then
    raise exception using errcode = 'P0001', message = 'photo_taken';
  end if;

  return true;
end;
$$;

-- Los campos llegan ya validados por lib/schemas/pet.ts; los checks de la tabla son la red.
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

  -- Antes que cualquier otra comprobación: un reintento de un intento que ya publicó termina como
  -- él, aunque desde entonces haya perdido el nivel 1 (FR-018).
  select p.id into v_pet from public.pets p where p.owner_id = p_owner and p.attempt_id = p_attempt;
  if v_pet is not null then
    return query select v_pet, true;
    return;
  end if;

  if not public.has_level_one(p_owner, p_pending_ttl) then
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
    locality, is_urgent
  )
  values (
    p_owner, p_attempt, p_fields ->> 'name', p_fields ->> 'species', p_fields ->> 'sex',
    (p_fields ->> 'age_value')::smallint, p_fields ->> 'age_unit',
    (p_fields ->> 'age_as_of')::date, p_fields ->> 'size', (p_fields ->> 'is_neutered')::boolean,
    p_fields ->> 'vaccines', (p_fields ->> 'has_chip')::boolean, p_fields ->> 'good_with_kids',
    p_fields ->> 'good_with_dogs', p_fields ->> 'good_with_cats', p_fields ->> 'description',
    p_fields ->> 'department', p_fields ->> 'locality', (p_fields ->> 'is_urgent')::boolean
  )
  returning id into v_pet;

  update public.pet_photos ph
     set pet_id = v_pet, position = o.ord - 1
    from unnest(p_photo_ids) with ordinality as o (id, ord)
   where ph.id = o.id;

  return query select v_pet, false;
end;
$$;

-- Devuelve las fotos que soltó, para que la acción borre ya sus objetos y filas (FR-020).
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
begin
  perform public.lock_phone_account(p_owner);

  if not exists (select 1 from public.pets p where p.id = p_pet and p.owner_id = p_owner) then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  if not public.has_level_one(p_owner, p_pending_ttl) then
    raise exception using errcode = 'P0001', message = 'needs_verification';
  end if;

  if v_count not between 1 and 5
     or (select count(distinct x) from unnest(p_photo_ids) as x) <> v_count then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  -- Una foto de la pantalla que ya no está enganchada a este animal ni en espera: otra pestaña la
  -- sacó, y guardar ahora no dejaría el animal como se ve (FR-020a).
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

-- Las candidatas de la purga: en espera más viejas que el TTL, o soltadas. Son justo las que
-- publish_pet y save_pet ya no aceptan, así que nunca se purga una foto que se está enganchando.
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
     and (ph.released_at is not null or ph.staged_at <= now() - p_staged_ttl);
$$;

-- Después de borrar los objetos: si eso falló, la fila sigue y la próxima purga lo reintenta.
create or replace function public.delete_pet_photo_rows(p_ids uuid[])
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.pet_photos ph where ph.id = any (p_ids) and ph.pet_id is null;
$$;

-- Supabase concede `execute` a anon y authenticated sobre toda función nueva de public.
revoke all on function public.has_level_one(uuid, interval) from public, anon, authenticated;
revoke all on function public.stage_pet_photo(uuid, uuid, smallint, smallint, text, interval)
  from public, anon, authenticated;
revoke all on function public.publish_pet(uuid, uuid, interval, interval, jsonb, uuid[])
  from public, anon, authenticated;
revoke all on function public.save_pet(uuid, uuid, interval, interval, jsonb, uuid[])
  from public, anon, authenticated;
revoke all on function public.purge_pet_photos(interval) from public, anon, authenticated;
revoke all on function public.delete_pet_photo_rows(uuid[]) from public, anon, authenticated;

grant execute on function public.has_level_one(uuid, interval) to service_role;
grant execute on function public.stage_pet_photo(uuid, uuid, smallint, smallint, text, interval)
  to service_role;
grant execute on function public.publish_pet(uuid, uuid, interval, interval, jsonb, uuid[])
  to service_role;
grant execute on function public.save_pet(uuid, uuid, interval, interval, jsonb, uuid[])
  to service_role;
grant execute on function public.purge_pet_photos(interval) to service_role;
grant execute on function public.delete_pet_photo_rows(uuid[]) to service_role;
