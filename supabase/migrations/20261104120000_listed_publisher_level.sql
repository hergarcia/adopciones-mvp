-- El nivel de quien publicó en cada tarjeta del listado, de «Recién publicados» y de los sugeridos
-- de Mi solicitud (historia #273). Sale de `private.publisher_level`, la misma cuenta que usan
-- `pet_by_code` y `litter_by_code` para lo que está a la vista, así la tarjeta nunca dice un nivel más
-- alto que la ficha en ese momento. El nivel ya era público en la ficha: nadie ve algo que antes no
-- veía. El perfil público usa la misma función y la pantalla no muestra la línea ahí.
--
-- Cambia lo que devuelven, así que las dos se vuelven a crear con el mismo cuerpo y una columna más.
-- `suggested_pets` lee `listed_pets` y se borra primero.
drop function public.suggested_pets(uuid, integer);

drop function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer, text
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
  p_limit integer default 25,
  p_owner_public_id text default null
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
  publisher_level smallint,
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
           l.age_as_of, l.department, l.locality, l.is_urgent, l.is_neutered,
           case when c.available = 0 and c.in_process > 0 then 'in_process' else 'available' end,
           l.published_at, l.owner_id, c.total, c.available, ph.id, ph.owner_id, ph.width,
           ph.height, ph.thumbhash
      from public.litters l
      join public.pet_photos ph on ph.litter_id = l.id and ph.position = 0
     cross join lateral (
       select count(*)::integer as total,
              (count(*) filter (where y.status = 'available'))::integer as available,
              (count(*) filter (where y.status = 'in_process'))::integer as in_process
         from public.pets y
        where y.litter_id = l.id
     ) c
     where private.litter_is_shown(l)
       and private.litter_state(l) = 'available'
       and (
         coalesce(cardinality(p_sexes), 0) = 0
         or exists (
           select 1
             from public.pets y
            where y.litter_id = l.id
              and y.status in ('available', 'in_process')
              and y.sex = any (p_sexes)
         )
       )
  )
  select s.kind, s.code, s.name, s.species, s.sex, s.size, s.age_value, s.age_unit, s.age_as_of,
         s.department, s.locality, s.is_urgent, s.status, s.published_at, s.young_count,
         s.available_count, s.cover_id, s.cover_owner, s.width, s.height, s.thumbhash,
         private.publisher_level(s.owner_id), count(*) over ()
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
     and (
       p_owner_public_id is null
       or s.owner_id = (select pr.id from public.profiles pr where pr.public_id = p_owner_public_id)
     )
     and (p_after_published is null or (s.published_at, s.code) < (p_after_published, p_after_code))
   order by s.published_at desc, s.code desc
   limit least(greatest(coalesce(p_limit, 25), 1), 241);
$$;

revoke all on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer, text
) from public, anon, authenticated;
grant execute on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer, text
) to anon, authenticated;

create function public.suggested_pets(p_application_id uuid, p_limit integer default 3)
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
  publisher_level smallint,
  total bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select (select auth.uid()) as viewer, p.species, pr.department, a.publisher_id,
           p.owner_id as pet_owner
      from public.applications a
      join public.pets p on p.id = a.pet_id
      join public.profiles pr on pr.id = a.applicant_id
     where a.id = p_application_id
       and a.applicant_id = (select auth.uid())
  ),
  candidates as (
    select l.*, true as is_near
      from mine m
     cross join lateral public.listed_pets(
       p_species => array[m.species],
       p_departments => array[m.department],
       p_limit => 241
     ) l
    union all
    select l.*, false
      from mine m
     cross join lateral public.listed_pets(p_species => array[m.species], p_limit => 241) l
     where l.department <> m.department
  ),
  owned as (
    select c.*, coalesce(p.owner_id, li.owner_id) as owner_id, p.id as pet_id, li.id as litter_id
      from candidates c
      left join public.pets p on c.kind = 'pet' and p.code = c.code
      left join public.litters li on c.kind = 'litter' and li.code = c.code
  )
  select o.kind, o.code, o.name, o.species, o.sex, o.size, o.age_value, o.age_unit, o.age_as_of,
         o.department, o.locality, o.is_urgent, o.status, o.published_at, o.young_count,
         o.available_count, o.cover_id, o.cover_owner, o.cover_width, o.cover_height,
         o.cover_thumbhash, o.publisher_level, count(*) over ()
    from owned o
   cross join mine m
   where o.owner_id <> m.viewer
     and o.owner_id is distinct from m.publisher_id
     and o.owner_id is distinct from m.pet_owner
     and not exists (
           select 1
             from public.blocks b
            where (b.blocker_id = o.owner_id and b.blocked_id = m.viewer)
               or (b.blocker_id = m.viewer and b.blocked_id = o.owner_id)
         )
     and (
       o.pet_id is null
       or not exists (
         select 1
           from public.applications x
          where x.applicant_id = m.viewer
            and x.pet_id = o.pet_id
            and x.status in ('sent', 'accepted', 'rejected')
       )
     )
     and (
       o.litter_id is null
       or exists (
         select 1
           from public.pets y
          where y.litter_id = o.litter_id
            and y.status in ('available', 'in_process')
            and y.taken_down_at is null
            and not exists (
              select 1
                from public.applications x
               where x.applicant_id = m.viewer
                 and x.pet_id = y.id
                 and x.status in ('sent', 'accepted', 'rejected')
            )
       )
     )
   order by o.is_near desc, o.published_at desc, o.code desc
   limit least(greatest(coalesce(p_limit, 3), 1), 241);
$$;

revoke all on function public.suggested_pets(uuid, integer) from public, anon, authenticated;
grant execute on function public.suggested_pets(uuid, integer) to authenticated;
