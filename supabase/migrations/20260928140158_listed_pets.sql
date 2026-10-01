-- Los animales a la vista (historia #57): el listado, la ficha pública y la vista previa. Lo público
-- sale solo por tres funciones `security definer` que llevan adentro la regla «a la vista» y
-- devuelven únicamente columnas públicas: RLS filtra filas y no columnas, y abrir la fila de
-- `profiles` de un publicador abriría también su zona y su fecha de alta (research R1). Las policies
-- de `pets`, `pet_photos`, `profiles` e `identity_verifications` no cambian.

-- El enlace ---------------------------------------------------------------------------------------

create table public.pet_codes (
  code text primary key,
  created_at timestamptz not null default now(),

  constraint pet_codes_code_format check (code ~ '^[0-9a-hjkmnp-tv-z]{10}$')
);

comment on table public.pet_codes is
  'Todos los códigos de enlace que se usaron alguna vez. Sin FK a pets: sobrevive al borrado del '
  'animal para que su código no se vuelva a usar (FR-010). No guarda nada de nadie.';

alter table public.pet_codes enable row level security;
revoke all on public.pet_codes from anon, authenticated;

-- 10 caracteres del alfabeto de Crockford en minúscula (sin i l o u), 5 bits cada uno: 50 bits al
-- azar, que no se adivinan ni se recorren (research R3). 256 es múltiplo de 32, así que el módulo no
-- sesga ninguna letra.
create or replace function private.new_pet_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
           substr('0123456789abcdefghjkmnpqrstvwxyz', get_byte(r.bytes, i) % 32 + 1, 1),
           '' order by i
         )
    from (select extensions.gen_random_bytes(10) as bytes) as r,
         generate_series(0, 9) as i;
$$;

-- Un código que ya se usó alguna vez no se entrega de nuevo: el registro lo rechaza y se pide otro.
create or replace function private.claim_pet_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  loop
    v_code := private.new_pet_code();
    insert into public.pet_codes (code) values (v_code) on conflict (code) do nothing;
    exit when found;
  end loop;
  return v_code;
end;
$$;

alter table public.pets add column code text;

comment on column public.pets.code is
  'El enlace de la ficha, /animales/{code}. Lo asigna el trigger al publicar y no cambia nunca: '
  'editar el nombre o las fotos no lo toca (FR-010).';

-- Las publicaciones de #53 reciben el suyo antes de que la columna sea obligatoria.
update public.pets set code = private.claim_pet_code() where code is null;

alter table public.pets
  alter column code set not null,
  add constraint pets_code_unique unique (code),
  add constraint pets_code_format check (code ~ '^[0-9a-hjkmnp-tv-z]{10}$');

create or replace function private.assign_pet_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.code := private.claim_pet_code();
  return new;
end;
$$;

create or replace function private.keep_pet_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.code is distinct from old.code then
    raise exception using errcode = 'P0001', message = 'pet_code_immutable';
  end if;
  return new;
end;
$$;

create trigger pets_assign_code
  before insert on public.pets
  for each row execute function private.assign_pet_code();

create trigger pets_keep_code
  before update of code on public.pets
  for each row execute function private.keep_pet_code();

-- El orden del listado y del cursor de «Ver más». Parcial: el listado solo lee disponibles.
create index pets_listing_idx on public.pets (published_at desc, code desc)
  where status = 'available';

-- Las reglas --------------------------------------------------------------------------------------

-- El TTL del número a medias. Las escrituras lo reciben de lib/verification/rules.ts, pero una
-- función que llama `anon` no puede recibirlo: bajarlo desde afuera haría visible el animal de un
-- publicador con un cambio a medias (FR-003). Un test lo compara con `DB_RULES.p_pending_ttl`.
create or replace function private.pending_ttl()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '7 days';
$$;

-- «A la vista» (FR-002), en un solo lugar: el publicador tiene hoy nivel 1. Invoker: solo la llaman
-- funciones `security definer`. Una llamada por fila que busca por la clave de `phones`; alcanza
-- para los miles de animales del MVP, y si no, se reemplaza por un `exists` dentro del listado.
create or replace function private.pet_is_listed(p_owner uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.identity_level_one(p_owner, private.pending_ttl());
$$;

-- La edad en meses del día `p_today`, igual que `ageOn` + `monthsBetween` de lib/pets/age.ts: un
-- mes se cumple el mismo día del mes siguiente o, si ese mes no lo tiene, su último día. `age()` de
-- Postgres cuenta distinto los fines de mes, y el filtro diría una edad y la ficha otra (R5).
create or replace function private.pet_age_months(
  p_value smallint,
  p_unit text,
  p_as_of date,
  p_today date
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select (case when p_unit = 'years' then p_value * 12 else p_value end)::integer
    + greatest(
        0,
        (extract(year from p_today)::integer - extract(year from p_as_of)::integer) * 12
          + extract(month from p_today)::integer - extract(month from p_as_of)::integer
          - case
              when extract(day from p_today)::integer < least(
                extract(day from p_as_of)::integer,
                extract(day from (date_trunc('month', p_today) + interval '1 month - 1 day'))::integer
              )
              then 1
              else 0
            end
      );
$$;

-- La versión de la vista previa: cambia con la portada, el nombre o la zona, y las apps piden la
-- imagen nueva (FR-011). La descripción no está: no sale en la imagen.
create or replace function private.pet_share_version(
  p_cover uuid,
  p_name text,
  p_department text,
  p_locality text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(md5(concat_ws('|', p_cover::text, p_name, p_department, p_locality)), 12);
$$;

-- Lo público ---------------------------------------------------------------------------------------

-- El listado. Con cursor, `total` es lo que queda; sin cursor, el total con los filtros. No devuelve
-- el id del animal; el de la cuenta sale solo como `cover_owner`, la carpeta que hay que firmar
-- (research R2, KL-57-1).
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
         p.locality, p.is_urgent, p.published_at, ph.id, ph.owner_id, ph.width, ph.height,
         ph.thumbhash, count(*) over ()
    from public.pets p
    join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
    cross join today
   where p.status = 'available'
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

-- Una ficha. Sin fila si el código no existe (incluido uno borrado con su cuenta). Oculta para quien
-- no es el publicador, solo dice `hidden`: nada del animal ni de quien lo publicó (FR-009). El
-- publicador la ve entera aunque no esté a la vista (FR-020), sin nivel: no se le dice uno que no
-- tiene. `pet_id` solo para el publicador, que es quien lo necesita para «Editar».
create or replace function public.pet_by_code(p_code text)
returns table (
  visibility text,
  is_owner boolean,
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
  publisher_level smallint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_pet public.pets%rowtype;
  v_listed boolean;
  v_owner boolean;
begin
  select * into v_pet from public.pets p where p.code = p_code;
  if not found then
    return;
  end if;

  v_listed := v_pet.status = 'available' and private.pet_is_listed(v_pet.owner_id);
  v_owner := coalesce((select auth.uid()) = v_pet.owner_id, false);

  if not v_listed and not v_owner then
    visibility := 'hidden';
    is_owner := false;
    return next;
    return;
  end if;

  return query
    select case when v_listed then 'listed' else 'hidden' end,
           v_owner,
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
             when not v_listed then null
             when exists (
               select 1 from public.identity_verifications iv where iv.user_id = v_pet.owner_id
             ) then 2::smallint
             else 1::smallint
           end
      from (select 1) as one
      left join public.profiles pr on pr.id = v_pet.owner_id;
end;
$$;

-- Lo mínimo para la imagen de la vista previa, igual para todos: sin fila si no está a la vista.
create or replace function public.pet_share_card(p_code text)
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
  select p.name, p.department, p.locality, ph.id, ph.owner_id, ph.width, ph.height,
         private.pet_share_version(ph.id, p.name, p.department, p.locality)
    from public.pets p
    join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
   where p.code = p_code
     and p.status = 'available'
     and private.pet_is_listed(p.owner_id);
$$;

-- Las fotos ---------------------------------------------------------------------------------------

-- Las usan las policies de Storage, que corren con los permisos de quien pide: `security definer`
-- para leer `pets` y `phones`, que `anon` no ve. La carpeta se compara como uuid solo si lo es, así
-- la búsqueda usa la clave y un nombre raro no rompe la consulta.
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
     where p.status = 'available'
       and private.pet_is_listed(p.owner_id)
  );
$$;

-- La foto de perfil de quien tiene al menos un animal a la vista (FR-004).
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
     where private.pet_is_listed(pr.id)
       and exists (
         select 1 from public.pets p where p.owner_id = pr.id and p.status = 'available'
       )
  );
$$;

-- Solo leer (firmar y bajar). Las de la dueña no cambian.
create policy pet_photos_objects_select_listed on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'pet-photos' and private.pet_photo_object_listed(name));

create policy avatars_select_listed_publisher on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars' and private.avatar_object_listed(name));

-- Permisos ----------------------------------------------------------------------------------------

-- `anon` necesita el esquema para las dos funciones de las policies; nada más de `private` le queda
-- abierto.
grant usage on schema private to anon;

revoke all on function private.new_pet_code() from public, anon, authenticated;
revoke all on function private.claim_pet_code() from public, anon, authenticated;
revoke all on function private.assign_pet_code() from public, anon, authenticated;
revoke all on function private.keep_pet_code() from public, anon, authenticated;
revoke all on function private.pending_ttl() from public, anon, authenticated;
revoke all on function private.pet_is_listed(uuid) from public, anon, authenticated;
revoke all on function private.pet_age_months(smallint, text, date, date)
  from public, anon, authenticated;
revoke all on function private.pet_share_version(uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function private.pet_photo_object_listed(text) from public, anon, authenticated;
revoke all on function private.avatar_object_listed(text) from public, anon, authenticated;

grant execute on function private.pet_photo_object_listed(text) to anon, authenticated;
grant execute on function private.avatar_object_listed(text) to anon, authenticated;

-- Supabase concede `execute` a anon y authenticated sobre toda función nueva de public: se revoca y
-- se concede explícito, para que la lista de quién puede llamar esté escrita acá.
revoke all on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
) from public, anon, authenticated;
revoke all on function public.pet_by_code(text) from public, anon, authenticated;
revoke all on function public.pet_share_card(text) from public, anon, authenticated;

grant execute on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
) to anon, authenticated;
grant execute on function public.pet_by_code(text) to anon, authenticated;
grant execute on function public.pet_share_card(text) to anon, authenticated;
