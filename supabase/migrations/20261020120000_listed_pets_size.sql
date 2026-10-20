-- La card del listado dice qué animal es: «Perra de 8 años, grande» (issue #198). El tamaño ya se
-- filtraba pero no se devolvía. `create or replace` no cambia un tipo de retorno, así que se borra y
-- se vuelve a crear, con los mismos permisos.
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
  select p.code, p.name, p.species, p.sex, p.size, p.age_value, p.age_unit, p.age_as_of,
         p.department, p.locality, p.is_urgent, p.status, p.published_at, ph.id, ph.owner_id,
         ph.width, ph.height, ph.thumbhash, count(*) over ()
    from public.pets p
    join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
    cross join today
   where p.status in ('available', 'in_process')
     and p.taken_down_at is null
     and p.expires_at > now()
     and private.pet_is_listed(p.owner_id)
     and not exists (
       select 1
         from public.blocks b
        where b.blocker_id = (select auth.uid())
          and b.blocked_id = p.owner_id
     )
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

revoke all on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
) from public, anon, authenticated;

grant execute on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
) to anon, authenticated;
