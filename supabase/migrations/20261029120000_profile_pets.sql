-- Los animales en adopción de cada rescatista en su perfil (historia #238): el listado de siempre con
-- un filtro de dueña al final. Una sola función para los dos lugares, así una regla de qué se ve que
-- cambie mañana cambia en el listado y en el perfil a la vez (research R1). Se filtra por el
-- `public_id`, que es lo que lleva la dirección del perfil: el `id` de la cuenta no sale del servidor.
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

-- La ficha lleva al perfil de quien publicó: tocar su nombre es el camino de la historia (criterio 2).
-- Hasta acá `publisher_public_id` salía solo para quien bloqueó a quien publicó (#13). Con «En
-- adopción» el perfil ya dice qué animales son de quién, así que esconder la dirección del perfil en
-- la ficha no protege nada (research R11). Mismo cuerpo, con `pr.public_id` en esa columna.
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
           pr.public_id,
           null::text
      from (select 1) as one
      left join public.profiles pr on pr.id = v_pet.owner_id;
end;
$$;

create or replace function public.litter_by_code(p_code text)
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
  publisher_public_id text,
  state text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_litter public.litters%rowtype;
  v_visibility text;
  v_state text;
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

  v_state := private.litter_state(v_litter);
  v_visibility := case
                    when v_state = 'taken_down' then 'hidden'
                    when v_state = 'paused' then 'paused'
                    when v_state = 'expired' then 'expired'
                    when not private.litter_is_shown(v_litter) then 'hidden'
                    else 'listed'
                  end;

  if not v_owner and v_visibility <> 'listed' then
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
                         'state', private.young_state(y),
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
             v_litter.name, v_litter.department, v_litter.locality,
             v_state = 'adopted'
           ),
           pr.display_name, pr.avatar_path, pr.is_rescuer,
           case
             when v_visibility = 'listed' then private.publisher_level(v_litter.owner_id)
           end,
           case when v_owner then v_litter.takedown_reason end,
           case when v_owner then v_litter.takedown_note end,
           pr.public_id,
           v_state
      from (select 1) as one
      left join public.profiles pr on pr.id = v_litter.owner_id;
end;
$$;
