-- Otros animales para pedir cuando una solicitud se cerró sin ser elegida (historia #259). Lo que se
-- ve sale de `listed_pets`, así una regla del listado que cambie mañana cambia también acá; esta
-- función solo elige entre lo que ya está a la vista. Cuándo se ofrecen lo decide la pantalla por el
-- estado de la solicitud; la base solo responde por las solicitudes de quien pregunta.
--
-- De la misma especie que el animal pedido, primero del departamento del perfil de quien solicitó y
-- después del resto del país, los más recientes primero. Nunca de quien publicó el que pidió, ni
-- propios, ni uno que ya pidió o que no le aceptaron, ni de alguien con quien hay un bloqueo en
-- cualquiera de los dos sentidos: sacarlo en silencio no le cuenta a nadie que hay un bloqueo (#13).
-- Una camada queda mientras tenga una cría que la persona todavía pueda pedir.
--
-- Cada vuelta a `listed_pets` trae a lo sumo 241: con dos (la zona y el país) un departamento con
-- muchos animales no se come a los cercanos. Sin el animal (se borró) no hay especie y no sale nada.
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
         o.cover_thumbhash, count(*) over ()
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
