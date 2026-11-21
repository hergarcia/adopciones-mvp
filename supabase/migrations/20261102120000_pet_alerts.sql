-- Avisos por correo de animales nuevos (historia #265): los filtros del listado guardados por una
-- persona, la primera aparición de cada animal y cada camada, el correo de cada día y su «Dejar de
-- recibir». Lo que se ve sale siempre de `listed_pets`: una regla del listado que cambie mañana
-- cambia también en el correo (research R3).

-- ---------------------------------------------------------------------------------------------
-- La primera aparición (research R1)
-- ---------------------------------------------------------------------------------------------

-- `published_at` cambia al renovar, así que no sirve para «la primera vez». Esta marca no se toca
-- más una vez puesta. Lo que ya existe arranca con su publicación: ningún aviso existe todavía, así
-- que nada viejo puede llegar como nuevo.
alter table public.pets add column first_listed_at timestamptz;
alter table public.litters add column first_listed_at timestamptz;

update public.pets set first_listed_at = published_at where litter_id is null;
update public.litters set first_listed_at = published_at;

create index pets_first_listed_pending_idx
  on public.pets (id)
  where first_listed_at is null and litter_id is null;
create index litters_first_listed_pending_idx
  on public.litters (id)
  where first_listed_at is null;

-- Las mismas condiciones que `listed_pets` sin filtros; una prueba de base compara las dos.
create function private.stamp_first_listed()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.pets p
     set first_listed_at = now()
   where p.first_listed_at is null
     and p.litter_id is null
     and p.status in ('available', 'in_process')
     and p.taken_down_at is null
     and p.expires_at > now()
     and private.pet_is_listed(p.owner_id)
     and exists (select 1 from public.pet_photos ph where ph.pet_id = p.id and ph.position = 0);

  update public.litters l
     set first_listed_at = now()
   where l.first_listed_at is null
     and private.litter_is_shown(l)
     and private.litter_state(l) = 'available'
     and exists (select 1 from public.pet_photos ph where ph.litter_id = l.id and ph.position = 0);
$$;

-- `[desde, hasta)` en meses de cada tramo: `AGE_BANDS` de lib/pets/rules.ts, con su prueba.
create function private.age_band_range(p_band text)
returns int4range
language sql
immutable
set search_path = ''
as $$
  select case p_band
           when 'puppy' then int4range(0, 12)
           when 'young' then int4range(12, 36)
           when 'adult' then int4range(36, 96)
           when 'senior' then int4range(96, null)
         end;
$$;

-- Sin repetidos y ordenado: dos avisos que el listado busca igual chocan en el índice único.
create function private.sorted_set(p_values text[])
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array(select distinct v from unnest(p_values) v order by v), '{}');
$$;

-- ---------------------------------------------------------------------------------------------
-- Los avisos
-- ---------------------------------------------------------------------------------------------

create table public.pet_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  species text[] not null default '{}',
  sexes text[] not null default '{}',
  sizes text[] not null default '{}',
  age_bands text[] not null default '{}',
  departments text[] not null default '{}',
  neutered_only boolean not null default false,
  created_at timestamptz not null default now(),
  -- Hasta dónde ya miró la última corrida que cubrió a la persona (research R2): solo crece.
  covered_until timestamptz not null default now(),

  constraint pet_alerts_species_valid check (species <@ array['dog', 'cat']),
  constraint pet_alerts_sexes_valid check (sexes <@ array['male', 'female']),
  constraint pet_alerts_sizes_valid check (sizes <@ array['small', 'medium', 'large']),
  constraint pet_alerts_age_bands_valid check (
    age_bands <@ array['puppy', 'young', 'adult', 'senior']
  ),
  constraint pet_alerts_departments_valid check (departments <@ array[
    'UY-AR', 'UY-CA', 'UY-CL', 'UY-CO', 'UY-DU', 'UY-FS', 'UY-FD', 'UY-LA', 'UY-MA', 'UY-MO',
    'UY-PA', 'UY-RV', 'UY-RO', 'UY-RN', 'UY-SA', 'UY-SJ', 'UY-SO', 'UY-TA', 'UY-TT'
  ]),
  constraint pet_alerts_one_department check (cardinality(departments) <= 1),
  constraint pet_alerts_covered_after_created check (covered_until >= created_at)
);

comment on table public.pet_alerts is
  'Los filtros del listado que una persona guardó para que le avisen por correo (historia #265). '
  'Solo los lee y los borra su dueña; quien administra no los ve ni Administrar los cuenta. Entran '
  'por create_pet_alert y cambian solo por la corrida de las 8.';

create unique index pet_alerts_same_filters_uq
  on public.pet_alerts (user_id, species, sexes, sizes, age_bands, departments, neutered_only);
create index pet_alerts_user_created_idx on public.pet_alerts (user_id, created_at, id);

alter table public.pet_alerts enable row level security;

create policy pet_alerts_select_own on public.pet_alerts
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy pet_alerts_delete_own on public.pet_alerts
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.pet_alerts from anon, authenticated;
grant select, delete on table public.pet_alerts to authenticated;

-- El correo de un día ya reclamado para una persona: dos corridas el mismo día no mandan dos.
create table public.pet_alert_sends (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

comment on table public.pet_alert_sends is
  'Que a una persona ya se le reclamó el correo de avisos de un día de Uruguay. No guarda qué llevó '
  'el correo; la corrida lo purga a los 7 días.';

create index pet_alert_sends_day_idx on public.pet_alert_sends (day);

alter table public.pet_alert_sends enable row level security;
revoke all on table public.pet_alert_sends from anon, authenticated;

-- El «Dejar de recibir» de cada correo, guardado como hash (research R6).
create table public.pet_alert_unsubscribe_links (
  token_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint pet_alert_unsubscribe_links_hash_format check (token_hash ~ '^[0-9a-f]{64}$')
);

comment on table public.pet_alert_unsubscribe_links is
  'El enlace «Dejar de recibir» de cada correo de avisos: solo su SHA-256, que corta todos los '
  'avisos de esa cuenta. La corrida lo purga a los 180 días.';

create index pet_alert_unsubscribe_links_user_idx on public.pet_alert_unsubscribe_links (user_id);
create index pet_alert_unsubscribe_links_created_idx
  on public.pet_alert_unsubscribe_links (created_at);

alter table public.pet_alert_unsubscribe_links enable row level security;
revoke all on table public.pet_alert_unsubscribe_links from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Crear un aviso (research R9)
-- ---------------------------------------------------------------------------------------------

-- 3: `ALERTS_MAX` de lib/alerts/rules.ts. El candado de la cuenta hace que dos pedidos a la vez se
-- cuenten de a uno. Marcar antes de insertar deja todo lo que la persona ve ahora con una marca
-- igual o anterior a su aviso: nunca le llega como nuevo.
--   created · duplicate · limit
create function public.create_pet_alert(
  p_species text[],
  p_sexes text[],
  p_sizes text[],
  p_age_bands text[],
  p_departments text[],
  p_neutered_only boolean
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
  ) then
    return 'duplicate';
  end if;

  if (select count(*) from public.pet_alerts a where a.user_id = v_user) >= 3 then
    return 'limit';
  end if;

  insert into public.pet_alerts
    (user_id, species, sexes, sizes, age_bands, departments, neutered_only)
  values
    (v_user, v_species, v_sexes, v_sizes, v_age_bands, v_departments, v_neutered);
  return 'created';
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- La corrida de las 8 (research R2, R3)
-- ---------------------------------------------------------------------------------------------

-- Lo nuevo de cada aviso de esas personas que hoy se ve en el listado: apareció por primera vez
-- después de lo ya cubierto y hasta la corrida, no es de la persona ni de alguien con un bloqueo en
-- cualquier dirección. `listed_pets` filtra bloqueos con `auth.uid()`, que acá es nulo.
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
         a.neutered_only, l.kind, l.code, l.name, l.species, l.sex, l.age_value, l.age_unit,
         l.age_as_of, l.department, l.locality, l.young_count, l.cover_id, o.first_listed_at, p_run
    from public.pet_alerts a
   cross join lateral public.listed_pets(
     p_species => a.species,
     p_sexes => a.sexes,
     p_sizes => a.sizes,
     p_age_bands => (select array_agg(private.age_band_range(b)) from unnest(a.age_bands) b),
     p_departments => a.departments,
     p_neutered_only => a.neutered_only,
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

-- Reclama a cada persona con avisos que todavía no tuvo el de hoy y devuelve una fila por aviso y
-- coincidencia, sin cortar ni deduplicar (eso lo hace `alertMailParts`). A la suspendida y a la que
-- no tiene nada nuevo les cierra el período acá y no las devuelve; la que sí tiene lo cierra con
-- `mark_pet_alerts_mailed` cuando su correo salió.
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
           m.departments, m.neutered_only, m.kind, m.code, m.name, m.item_species, m.sex,
           m.age_value, m.age_unit, m.age_as_of, m.department, m.locality, m.young_count,
           m.cover_id, m.first_listed_at, m.run_at
      from matches m
     order by m.user_id, m.alert_created_at, m.alert_id;
end;
$$;

-- El correo salió: lo que miró esta corrida ya no vuelve en otro.
create function public.mark_pet_alerts_mailed(p_user uuid, p_run_at timestamptz)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.pet_alerts a
     set covered_until = greatest(a.covered_until, p_run_at)
   where a.user_id = p_user
     and a.created_at <= p_run_at;
$$;

-- ---------------------------------------------------------------------------------------------
-- Dejar de recibir (research R6, R7)
-- ---------------------------------------------------------------------------------------------

create function public.create_pet_alert_unsubscribe_link(p_user uuid, p_token_hash text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.pet_alert_unsubscribe_links (token_hash, user_id)
  values (p_token_hash, p_user);
$$;

-- La pantalla pregunta antes de montar la hoja, sin borrar nada: un lector de correo que abre el
-- enlace no corta los avisos.
create function public.pet_alert_unsubscribe_link_exists(p_token_hash text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.pet_alert_unsubscribe_links k
     where k.token_hash = p_token_hash
       and k.created_at >= now() - interval '180 days'
  );
$$;

-- Corta todos los avisos que la cuenta tiene ahora, también los creados después de ese correo.
--   done (con cuántos borró) · unknown
create function public.unsubscribe_pet_alerts(p_token_hash text)
returns table (outcome text, deleted integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_deleted integer;
begin
  select k.user_id into v_user
    from public.pet_alert_unsubscribe_links k
   where k.token_hash = p_token_hash
     and k.created_at >= now() - interval '180 days';
  if v_user is null then
    return query select 'unknown'::text, 0;
    return;
  end if;

  delete from public.pet_alerts a where a.user_id = v_user;
  get diagnostics v_deleted = row_count;
  return query select 'done'::text, v_deleted;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.stamp_first_listed() from public, anon, authenticated;
revoke all on function private.age_band_range(text) from public, anon, authenticated;
revoke all on function private.sorted_set(text[]) from public, anon, authenticated;
revoke all on function private.pet_alert_matches(uuid[], timestamptz)
  from public, anon, authenticated;
revoke all on function public.create_pet_alert(text[], text[], text[], text[], text[], boolean)
  from public, anon, authenticated;
revoke all on function public.claim_pet_alert_mail() from public, anon, authenticated;
revoke all on function public.mark_pet_alerts_mailed(uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.create_pet_alert_unsubscribe_link(uuid, text)
  from public, anon, authenticated;
revoke all on function public.pet_alert_unsubscribe_link_exists(text)
  from public, anon, authenticated;
revoke all on function public.unsubscribe_pet_alerts(text) from public, anon, authenticated;

grant execute on function public.create_pet_alert(text[], text[], text[], text[], text[], boolean)
  to authenticated;
grant execute on function public.claim_pet_alert_mail() to service_role;
grant execute on function public.mark_pet_alerts_mailed(uuid, timestamptz) to service_role;
grant execute on function public.create_pet_alert_unsubscribe_link(uuid, text) to service_role;
grant execute on function public.pet_alert_unsubscribe_link_exists(text) to service_role;
grant execute on function public.unsubscribe_pet_alerts(text) to service_role;

-- ---------------------------------------------------------------------------------------------
-- La marca cada 5 minutos, antes de la vuelta del ciclo de vida (research R1)
-- ---------------------------------------------------------------------------------------------

-- Así un animal publicado de noche y pausado a las 7 ya tiene su marca, y al reanudarse no es nuevo.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'pet-lifecycle'),
  command => $job$select private.stamp_first_listed(); select public.pet_lifecycle_tick(); select private.task_ran('pet-lifecycle')$job$
);
