-- La solicitud escrita que no salió tiene pantalla propia (historia #294): el animal, el motivo y una
-- salida, que es el animal si hoy recibe solicitudes o, si no, otros como él con las reglas de los
-- sugeridos de #259. La elección de los sugeridos pasa a una función privada que comparten la
-- solicitud cerrada y la escrita que no salió, así las dos dicen lo mismo.

-- Lo que hacía `suggested_pets`, con la persona y el animal pedido como parámetros. También deja afuera
-- un animal o una camada por la que la persona tiene una solicitud escrita esperando su identidad: ya
-- lo pidió, como una mandada.
create function private.suggestions_for(
  p_viewer uuid,
  p_species text,
  p_department text,
  p_publisher uuid,
  p_pet_owner uuid,
  p_limit integer
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
  with candidates as (
    select l.*, true as is_near
      from public.listed_pets(
        p_species => array[p_species],
        p_departments => array[p_department],
        p_limit => 241
      ) l
    union all
    select l.*, false
      from public.listed_pets(p_species => array[p_species], p_limit => 241) l
     where l.department <> p_department
  ),
  owned as (
    select c.*, coalesce(p.owner_id, li.owner_id) as owner_id, p.id as pet_id, li.id as litter_id
      from candidates c
      left join public.pets p on c.kind = 'pet' and p.code = c.code
      left join public.litters li on c.kind = 'litter' and li.code = c.code
  ),
  asked as (
    select x.pet_id
      from public.applications x
     where x.applicant_id = p_viewer
       and x.status in ('sent', 'accepted', 'rejected')
    union
    select h.pet_id
      from public.held_applications h
     where h.applicant_id = p_viewer
       and h.status = 'waiting'
  )
  select o.kind, o.code, o.name, o.species, o.sex, o.size, o.age_value, o.age_unit, o.age_as_of,
         o.department, o.locality, o.is_urgent, o.status, o.published_at, o.young_count,
         o.available_count, o.cover_id, o.cover_owner, o.cover_width, o.cover_height,
         o.cover_thumbhash, o.publisher_level, count(*) over ()
    from owned o
   where p_viewer is not null
     and p_species is not null
     and o.owner_id <> p_viewer
     and o.owner_id is distinct from p_publisher
     and o.owner_id is distinct from p_pet_owner
     and not exists (
           select 1
             from public.blocks b
            where (b.blocker_id = o.owner_id and b.blocked_id = p_viewer)
               or (b.blocker_id = p_viewer and b.blocked_id = o.owner_id)
         )
     and (o.pet_id is null or not exists (select 1 from asked k where k.pet_id = o.pet_id))
     and (
       o.litter_id is null
       or exists (
         select 1
           from public.pets y
          where y.litter_id = o.litter_id
            and y.status in ('available', 'in_process')
            and y.taken_down_at is null
            and not exists (select 1 from asked k where k.pet_id = y.id)
       )
     )
   order by o.is_near desc, o.published_at desc, o.code desc
   limit least(greatest(coalesce(p_limit, 3), 1), 241);
$$;

-- La misma firma y lo mismo que devuelve: cambia solo dónde vive la elección.
create or replace function public.suggested_pets(p_application_id uuid, p_limit integer default 3)
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
  select s.*
    from public.applications a
    join public.pets p on p.id = a.pet_id
    join public.profiles pr on pr.id = a.applicant_id
   cross join lateral private.suggestions_for(
     a.applicant_id, p.species, pr.department, a.publisher_id, p.owner_id, p_limit
   ) s
   where a.id = p_application_id
     and a.applicant_id = (select auth.uid());
$$;

-- Los de una escrita que no salió. Cuándo se ofrecen lo decide la pantalla por el motivo y por si el
-- animal recibe hoy; la base solo responde por las de quien pregunta. Sin el animal (se borró) no hay
-- especie y no sale nada, como en #259.
create function public.held_suggested_pets(p_held_id uuid, p_limit integer default 3)
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
  select s.*
    from public.held_applications h
    join public.pets p on p.id = h.pet_id
    join public.profiles pr on pr.id = h.applicant_id
   cross join lateral private.suggestions_for(
     h.applicant_id, p.species, pr.department, h.publisher_id, p.owner_id, p_limit
   ) s
   where h.id = p_held_id
     and h.status = 'lapsed'
     and h.applicant_id = (select auth.uid());
$$;

-- Una que se dejó escrita y no salió, como la lee quien la escribió. `receiving` dice si hoy recibe
-- solicitudes de esta persona: nulo si no se le muestra o si hay un bloqueo en cualquiera de los dos
-- sentidos, que la ficha no dejaría pedir.
create function public.my_lapsed_held_application(p_id uuid)
returns table (
  id uuid,
  lapse_reason text,
  written_at timestamptz,
  code text,
  pet_name text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  litter_name text,
  receiving text
)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, h.lapse_reason, h.written_at,
         v.code,
         coalesce(v.name, h.pet_name),
         v.cover_id, v.cover_owner, v.cover_width, v.cover_height, v.cover_thumbhash,
         coalesce(case when v.shows then private.litter_name_of(h.pet_id) end, h.litter_name),
         (
           select private.pet_receives_applications(p)
             from public.pets p
            where p.id = h.pet_id
              and v.shows
              and not exists (
                    select 1
                      from public.blocks b
                     where (b.blocker_id = p.owner_id and b.blocked_id = h.applicant_id)
                        or (b.blocker_id = h.applicant_id and b.blocked_id = p.owner_id)
                  )
         )
    from public.held_applications h
    left join lateral private.application_pet(h.pet_id, h.applicant_id) v on true
   where h.id = p_id
     and h.status = 'lapsed'
     and h.applicant_id = (select auth.uid());
$$;

revoke all on function private.suggestions_for(uuid, text, text, uuid, uuid, integer)
  from public, anon, authenticated;
revoke all on function public.suggested_pets(uuid, integer) from public, anon, authenticated;
revoke all on function public.held_suggested_pets(uuid, integer) from public, anon, authenticated;
revoke all on function public.my_lapsed_held_application(uuid) from public, anon, authenticated;

grant execute on function public.suggested_pets(uuid, integer) to authenticated;
grant execute on function public.held_suggested_pets(uuid, integer) to authenticated;
grant execute on function public.my_lapsed_held_application(uuid) to authenticated;
