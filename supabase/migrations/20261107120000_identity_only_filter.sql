-- «Solo de quien verificó su identidad» en el listado y en los avisos (historia #285). El listado
-- filtra con `private.publisher_level`, la misma cuenta que pinta la tarjeta, así el filtro nunca deja
-- afuera a quien su tarjeta dice que tiene la identidad verificada. El aviso guarda la elección en
-- una columna propia, y la corrida de las 8 la pasa a `listed_pets`, que lee el nivel a esa hora.
--
-- Las cuatro funciones cambian de firma o de lo que devuelven, así que se borran y se crean de nuevo
-- con el mismo cuerpo, primero la que llama. `suggested_pets` llama a `listed_pets` por nombre con
-- parámetros nombrados y el parámetro nuevo tiene valor por omisión: sigue andando sin tocarla.
drop function public.claim_pet_alert_mail();
drop function private.pet_alert_matches(uuid[], timestamptz);
drop function public.create_pet_alert(text[], text[], text[], text[], text[], boolean);
drop function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer, text
);

alter table public.pet_alerts add column identity_only boolean not null default false;

drop index public.pet_alerts_same_filters_uq;
create unique index pet_alerts_same_filters_uq
  on public.pet_alerts
  (user_id, species, sexes, sizes, age_bands, departments, neutered_only, identity_only);

comment on table public.pet_alerts is
  'Los filtros del listado que una persona guardó para que le avisen por correo (historia #265), '
  'también «Solo de quien verificó su identidad» (historia #285). Solo los lee y los borra su dueña; '
  'quien administra no los ve ni Administrar los cuenta. Entran por create_pet_alert y cambian solo '
  'por la corrida de las 8.';

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
  p_owner_public_id text default null,
  p_identity_only boolean default false
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
     and (not coalesce(p_identity_only, false) or private.publisher_level(s.owner_id) >= 2)
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

create function private.pet_alert_matches(p_users uuid[], p_run timestamptz)
returns table (
  user_id uuid,
  alert_id uuid,
  alert_created_at timestamptz,
  species text[],
  sexes text[],
  sizes text[],
  age_bands text[],
  departments text[],
  neutered_only boolean,
  identity_only boolean,
  kind text,
  code text,
  name text,
  item_species text,
  sex text,
  age_value smallint,
  age_unit text,
  age_as_of date,
  department text,
  locality text,
  young_count integer,
  cover_id uuid,
  first_listed_at timestamptz,
  run_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.user_id, a.id, a.created_at, a.species, a.sexes, a.sizes, a.age_bands, a.departments,
         a.neutered_only, a.identity_only, l.kind, l.code, l.name, l.species, l.sex, l.age_value,
         l.age_unit, l.age_as_of, l.department, l.locality, l.young_count, l.cover_id,
         o.first_listed_at, p_run
    from public.pet_alerts a
   cross join lateral public.listed_pets(
     p_species => a.species,
     p_sexes => a.sexes,
     p_sizes => a.sizes,
     p_age_bands => (select array_agg(private.age_band_range(b)) from unnest(a.age_bands) b),
     p_departments => a.departments,
     p_neutered_only => a.neutered_only,
     p_identity_only => a.identity_only,
     p_limit => 241
   ) l
   cross join lateral (
     select coalesce(p.first_listed_at, li.first_listed_at) as first_listed_at,
            coalesce(p.owner_id, li.owner_id) as owner_id
       from (select 1) one
       left join public.pets p on l.kind = 'pet' and p.code = l.code
       left join public.litters li on l.kind = 'litter' and li.code = l.code
   ) o
   where a.user_id = any (p_users)
     and a.created_at <= p_run
     and o.first_listed_at > a.covered_until
     and o.first_listed_at <= p_run
     and o.owner_id <> a.user_id
     and not exists (
           select 1
             from public.blocks b
            where (b.blocker_id = o.owner_id and b.blocked_id = a.user_id)
               or (b.blocker_id = a.user_id and b.blocked_id = o.owner_id)
         );
$$;

create function public.claim_pet_alert_mail()
returns table (
  user_id uuid,
  alert_id uuid,
  alert_created_at timestamptz,
  species text[],
  sexes text[],
  sizes text[],
  age_bands text[],
  departments text[],
  neutered_only boolean,
  identity_only boolean,
  kind text,
  code text,
  name text,
  item_species text,
  sex text,
  age_value smallint,
  age_unit text,
  age_as_of date,
  department text,
  locality text,
  young_count integer,
  cover_id uuid,
  first_listed_at timestamptz,
  run_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_run timestamptz := now();
  v_day date := public.uruguay_today();
  v_users uuid[];
begin
  delete from public.pet_alert_sends s where s.day < v_day - 7;
  delete from public.pet_alert_unsubscribe_links k where k.created_at < v_run - interval '180 days';
  perform private.stamp_first_listed();

  with claimed as (
    insert into public.pet_alert_sends (user_id, day)
    select distinct a.user_id, v_day
      from public.pet_alerts a
     where a.created_at <= v_run
    on conflict do nothing
    returning pet_alert_sends.user_id
  )
  select coalesce(array_agg(c.user_id), '{}') into v_users from claimed c;

  return query
    with listed as (
      select u as id from unnest(v_users) u where not private.is_suspended(u)
    ),
    matches as (
      select m.*
        from private.pet_alert_matches(array(select l.id from listed l), v_run) m
    ),
    covered as (
      update public.pet_alerts a
         set covered_until = greatest(a.covered_until, v_run)
       where a.user_id = any (v_users)
         and a.created_at <= v_run
         and not exists (select 1 from matches m where m.user_id = a.user_id)
      returning a.id
    )
    select m.user_id, m.alert_id, m.alert_created_at, m.species, m.sexes, m.sizes, m.age_bands,
           m.departments, m.neutered_only, m.identity_only, m.kind, m.code, m.name,
           m.item_species, m.sex, m.age_value, m.age_unit, m.age_as_of, m.department, m.locality,
           m.young_count, m.cover_id, m.first_listed_at, m.run_at
      from matches m
     order by m.user_id, m.alert_created_at, m.alert_id;
end;
$$;

create function public.create_pet_alert(
  p_species text[],
  p_sexes text[],
  p_sizes text[],
  p_age_bands text[],
  p_departments text[],
  p_neutered_only boolean,
  p_identity_only boolean default false
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_species text[] := private.sorted_set(p_species);
  v_sexes text[] := private.sorted_set(p_sexes);
  v_sizes text[] := private.sorted_set(p_sizes);
  v_age_bands text[] := private.sorted_set(p_age_bands);
  v_departments text[] := private.sorted_set(p_departments);
  v_neutered boolean := coalesce(p_neutered_only, false);
  v_identity boolean := coalesce(p_identity_only, false);
begin
  if v_user is null then
    raise exception using errcode = 'P0001', message = 'not_signed_in';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('pet-alerts:' || v_user::text, 0));
  perform private.stamp_first_listed();

  if exists (
    select 1
      from public.pet_alerts a
     where a.user_id = v_user
       and a.species = v_species
       and a.sexes = v_sexes
       and a.sizes = v_sizes
       and a.age_bands = v_age_bands
       and a.departments = v_departments
       and a.neutered_only = v_neutered
       and a.identity_only = v_identity
  ) then
    return 'duplicate';
  end if;

  if (select count(*) from public.pet_alerts a where a.user_id = v_user) >= 3 then
    return 'limit';
  end if;

  insert into public.pet_alerts
    (user_id, species, sexes, sizes, age_bands, departments, neutered_only, identity_only)
  values
    (v_user, v_species, v_sexes, v_sizes, v_age_bands, v_departments, v_neutered, v_identity);
  return 'created';
end;
$$;

revoke all on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer, text, boolean
) from public, anon, authenticated;
grant execute on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer, text, boolean
) to anon, authenticated;

revoke all on function private.pet_alert_matches(uuid[], timestamptz)
  from public, anon, authenticated;
revoke all on function public.claim_pet_alert_mail() from public, anon, authenticated;
revoke all on function public.create_pet_alert(
  text[], text[], text[], text[], text[], boolean, boolean
) from public, anon, authenticated;

grant execute on function public.claim_pet_alert_mail() to service_role;
grant execute on function public.create_pet_alert(
  text[], text[], text[], text[], text[], boolean, boolean
) to authenticated;
