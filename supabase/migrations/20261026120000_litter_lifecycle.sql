-- La vida de una camada (#206): la camada guarda solo lo suyo (pausa, vencimiento, recordatorio) y
-- cada cría sigue siendo un animal con su `status`, así las reglas de #63, #65, #67 y #69 valen para
-- ella sin tocarlas (research R1). El estado de la camada se calcula con `private.litter_state`.

-- Las columnas ------------------------------------------------------------------------------------

-- Las camadas ya publicadas no vencían (#205): cuentan sus 30 días desde hoy, no desde que se
-- publicaron, así ninguna vence sin el correo de los 7 días (FR-001).
alter table public.litters
  add column paused_at timestamptz,
  add column expires_at timestamptz not null default now() + interval '30 days',
  add column reminder_sent_at timestamptz,
  add column expiry_counted_at timestamptz;

comment on column public.litters.expires_at is
  'El único vencimiento que se escribe: litters_sync_young_expiry lo copia a sus crías (R3).';

create index litters_reminder_due_idx on public.litters (expires_at)
  where reminder_sent_at is null and taken_down_at is null and paused_at is null;

-- A dónde vuelve una cría pausada con su camada (R2): un animal suelto reanudado vuelve siempre a
-- disponible, una cría vuelve a lo que era.
alter table public.pets
  add column resume_status text,
  add constraint pets_resume_status_valid check (resume_status in ('available', 'in_process')),
  add constraint pets_resume_status_young check (
    resume_status is null or (status = 'paused' and litter_id is not null)
  );

-- Una cría que deja de estar pausada por otro camino (marcada adoptada con la camada pausada) ya no
-- tiene a dónde volver; así `mark_pet_adopted` no necesita saber de camadas.
create function private.pets_clear_resume_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'paused' then
    new.resume_status := null;
  end if;
  return new;
end;
$$;

create trigger pets_clear_resume_status
  before update of status on public.pets
  for each row execute function private.pets_clear_resume_status();

-- Las crías que vencen (disponibles o en proceso) llevan el vencimiento de su camada; pausadas y
-- adoptadas no vencen (`pets_expiry_matches_status`).
create function private.litters_sync_young_expiry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.pets p
     set expires_at = new.expires_at
   where p.litter_id = new.id
     and p.status in ('available', 'in_process')
     and p.expires_at is distinct from new.expires_at;
  return null;
end;
$$;

create trigger litters_sync_young_expiry
  after update of expires_at on public.litters
  for each row execute function private.litters_sync_young_expiry();

update public.pets p
   set expires_at = l.expires_at
  from public.litters l
 where l.id = p.litter_id
   and p.status in ('available', 'in_process');

-- El estado de la camada (R1): adoptada va antes que pausada, así marcar adoptada a la última cría
-- de una camada pausada la deja adoptada (FR-030).
create function private.litter_state(l public.litters)
returns text
language sql
stable
set search_path = ''
as $$
  select case
           when l.taken_down_at is not null then 'taken_down'
           when not exists (
             select 1 from public.pets p where p.litter_id = l.id and p.status <> 'adopted'
           ) then 'adopted'
           when l.paused_at is not null then 'paused'
           when l.expires_at <= now() then 'expired'
           else 'available'
         end;
$$;

-- El nombre de la camada en la solicitud de una cría que se cierra (R8): la cría puede dejar de
-- existir, y «Mis solicitudes» lo sigue diciendo.
alter table public.applications add column litter_name text;

-- Publicar y guardar la camada con su vencimiento -----------------------------------------------

-- La de #205: cada cría nace con el vencimiento de su camada (R3).
create or replace function public.publish_litter(
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
      clock_timestamp(), v_litter.expires_at
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

-- La de #205: una cría nueva nace con el vencimiento de su camada o, si la camada está pausada,
-- pausada con ella y lista para volver disponible al reanudar (R2, R3).
create or replace function public.save_litter(
  p_owner uuid,
  p_litter uuid,
  p_pending_ttl interval,
  p_staged_ttl interval,
  p_fields jsonb,
  p_photo_ids uuid[],
  p_young jsonb
)
returns table (code text, released uuid[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_litter public.litters%rowtype;
  v_young_count integer := coalesce(jsonb_array_length(p_young), 0);
  v_delivers date := (p_fields ->> 'delivers_from')::date;
  v_all uuid[];
  v_kept uuid[];
  v_known integer;
  v_released uuid[];
  v_young jsonb;
  v_pet uuid;
begin
  perform public.lock_phone_account(p_owner);

  select * into v_litter from public.litters l
   where l.id = p_litter and l.owner_id = p_owner
   for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  if v_litter.taken_down_at is not null then
    raise exception using errcode = 'P0001', message = 'taken_down';
  end if;

  if not public.identity_level_one(p_owner, p_pending_ttl) then
    raise exception using errcode = 'P0001', message = 'needs_verification';
  end if;

  if v_young_count not between 1 and 10 then
    raise exception using errcode = 'P0001', message = 'young_count';
  end if;

  if (select count(distinct lower(btrim(y ->> 'name'))) from jsonb_array_elements(p_young) y)
     <> v_young_count then
    raise exception using errcode = 'P0001', message = 'young_name_taken';
  end if;

  if v_delivers is distinct from v_litter.delivers_from
     and v_delivers < public.uruguay_today() then
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
  if (select count(distinct x) from unnest(v_all) as x) <> cardinality(v_all) then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  -- Una cría de la pantalla que ya no está en la camada: otra pestaña la quitó, y guardar ahora la
  -- haría volver.
  if exists (
    select 1 from jsonb_array_elements(p_young) y
     where y ->> 'id' is not null
       and not exists (
         select 1 from public.pets p where p.litter_id = p_litter and p.id::text = y ->> 'id'
       )
  ) then
    raise exception using errcode = 'P0001', message = 'changed_elsewhere';
  end if;

  select coalesce(array_agg(p.id), '{}') into v_kept
    from public.pets p
   where p.litter_id = p_litter
     and exists (
       select 1 from jsonb_array_elements(p_young) y
        where p.id::text = y ->> 'id' or p.attempt_id::text = y ->> 'key'
     );

  -- Como al guardar un animal: cada foto de la pantalla es de esta camada, de una cría que sigue o
  -- está en espera; si no, otra pestaña la sacó.
  select count(*) into v_known
    from public.pet_photos ph
   where ph.id = any (v_all)
     and ph.owner_id = p_owner
     and (
       ph.litter_id = p_litter
       or ph.pet_id = any (v_kept)
       or (ph.pet_id is null and ph.litter_id is null and ph.released_at is null)
     );
  if v_known <> cardinality(v_all) then
    raise exception using errcode = 'P0001', message = 'changed_elsewhere';
  end if;

  if exists (
    select 1 from public.pet_photos ph
     where ph.id = any (v_all)
       and ph.pet_id is null
       and ph.litter_id is null
       and ph.staged_at <= now() - p_staged_ttl
  ) then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  with freed as (
    update public.pet_photos ph
       set pet_id = null, litter_id = null, position = null, released_at = now()
     where (
         ph.litter_id = p_litter
         or ph.pet_id in (select p.id from public.pets p where p.litter_id = p_litter)
       )
       and ph.id <> all (v_all)
    returning ph.id
  )
  select coalesce(array_agg(f.id), '{}') into v_released from freed f;

  delete from public.pets p where p.litter_id = p_litter and p.id <> all (v_kept);

  update public.litters l
     set name = p_fields ->> 'name',
         species = p_fields ->> 'species',
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
         required_level = coalesce((p_fields ->> 'required_level')::smallint, 1),
         delivers_from = v_delivers
   where l.id = p_litter
  returning * into v_litter;

  -- Revisada y editada vuelve a la lista (FR-045); si todavía espera, sigue como estaba, como un
  -- animal en `save_pet`.
  insert into public.pet_reviews as r (litter_id, pending_kind, pending_since)
  values (p_litter, 'edited', now())
  on conflict (litter_id) do update
    set pending_kind = 'edited', pending_since = now()
    where r.pending_kind is null;

  update public.pet_photos ph
     set litter_id = p_litter, pet_id = null, position = o.ord - 1
    from unnest(p_photo_ids) with ordinality as o (id, ord)
   where ph.id = o.id;

  for v_young in select y from jsonb_array_elements(p_young) y loop
    select p.id into v_pet
      from public.pets p
     where p.litter_id = p_litter
       and (p.id::text = v_young ->> 'id' or p.attempt_id::text = v_young ->> 'key');

    if v_pet is null then
      insert into public.pets (
        owner_id, attempt_id, litter_id, name, species, sex, age_value, age_unit, age_as_of, size,
        is_neutered, vaccines, has_chip, good_with_kids, good_with_dogs, good_with_cats,
        description, department, locality, is_urgent, required_level, published_at, expires_at,
        status, resume_status
      )
      values (
        p_owner, (v_young ->> 'key')::uuid, p_litter, v_young ->> 'name', v_litter.species,
        v_young ->> 'sex', v_litter.age_value, v_litter.age_unit, v_litter.age_as_of,
        v_litter.size, v_litter.is_neutered, v_litter.vaccines, v_litter.has_chip,
        v_litter.good_with_kids, v_litter.good_with_dogs, v_litter.good_with_cats,
        v_young ->> 'description', v_litter.department, v_litter.locality, v_litter.is_urgent,
        v_litter.required_level, clock_timestamp(),
        case when v_litter.paused_at is null then v_litter.expires_at end,
        case when v_litter.paused_at is null then 'available' else 'paused' end,
        case when v_litter.paused_at is not null then 'available' end
      )
      returning id into v_pet;
    else
      update public.pets p
         set name = v_young ->> 'name',
             sex = v_young ->> 'sex',
             description = v_young ->> 'description',
             species = v_litter.species,
             age_value = v_litter.age_value,
             age_unit = v_litter.age_unit,
             age_as_of = v_litter.age_as_of,
             size = v_litter.size,
             is_neutered = v_litter.is_neutered,
             vaccines = v_litter.vaccines,
             has_chip = v_litter.has_chip,
             good_with_kids = v_litter.good_with_kids,
             good_with_dogs = v_litter.good_with_dogs,
             good_with_cats = v_litter.good_with_cats,
             department = v_litter.department,
             locality = v_litter.locality,
             is_urgent = v_litter.is_urgent,
             required_level = v_litter.required_level
       where p.id = v_pet;
    end if;

    update public.pet_photos ph
       set pet_id = v_pet, litter_id = null, position = o.ord - 1
      from jsonb_array_elements_text(coalesce(v_young -> 'photo_ids', '[]'::jsonb))
           with ordinality as o (id, ord)
     where ph.id = o.id::uuid;
  end loop;

  return query select v_litter.code, v_released;
end;
$$;

-- Las crías primero y la camada después: el cierre de sus solicitudes todavía lee el nombre de la
-- camada (R8). Sin ese orden, la cascada las borra con la camada ya ida.
create or replace function public.delete_litter(p_owner uuid, p_litter uuid)
returns table (outcome text, code text, released uuid[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_litter public.litters%rowtype;
  v_released uuid[];
begin
  perform public.lock_phone_account(p_owner);

  select * into v_litter from public.litters l
   where l.id = p_litter and l.owner_id = p_owner
   for update;
  if not found then
    return query select 'not_found', null::text, '{}'::uuid[];
    return;
  end if;

  with freed as (
    update public.pet_photos ph
       set pet_id = null, litter_id = null, position = null, released_at = now()
     where ph.litter_id = p_litter
        or ph.pet_id in (select p.id from public.pets p where p.litter_id = p_litter)
    returning ph.id
  )
  select coalesce(array_agg(f.id), '{}') into v_released from freed f;

  delete from public.pets p where p.litter_id = p_litter;
  delete from public.litters l where l.id = p_litter;

  return query select 'done', v_litter.code, v_released;
end;
$$;

-- Los cierres por la cría copian también el nombre de la camada (R8) -------------------------------

create or replace function private.litter_name_of(p_pet uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select l.name
    from public.pets p
    join public.litters l on l.id = p.litter_id
   where p.id = p_pet;
$$;

create or replace function private.applications_close_on_pet_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text;
begin
  v_reason := case
                when new.taken_down_at is not null and old.taken_down_at is null then 'unpublished'
                when new.status = 'adopted' and old.status <> 'adopted' then 'adopted'
              end;
  if v_reason is not null then
    with closed as (
      update public.applications a
         set status = 'closed', close_reason = v_reason, changed_at = now(), pet_name = new.name,
             litter_name = private.litter_name_of(new.id)
       where a.pet_id = new.id
         and a.status in ('sent', 'accepted')
      returning a.id, a.applicant_id
    )
    insert into public.application_notices (kind, application_id, recipient_id)
    select case v_reason when 'adopted' then 'closed_adopted' else 'closed_unpublished' end,
           c.id, c.applicant_id
      from closed c;
  end if;
  return null;
end;
$$;

create or replace function private.applications_close_on_pet_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  with closed as (
    update public.applications a
       set status = 'closed', close_reason = 'unpublished', changed_at = now(), pet_name = old.name,
           litter_name = private.litter_name_of(old.id)
     where a.pet_id = old.id
       and a.status in ('sent', 'accepted')
    returning a.id, a.applicant_id
  )
  insert into public.application_notices (kind, application_id, recipient_id)
  select 'closed_unpublished', c.id, c.applicant_id
    from closed c;
  return old;
end;
$$;

-- Responder las solicitudes de cada cría (US1) -----------------------------------------------------

drop function public.publisher_inbox();

-- La bandeja (R7): lo de #65 y, en la fila de una cría, su camada y su lugar en ella. Una camada con
-- alguna solicitud trae todas sus crías, las que no tienen ninguna en cero, así la pantalla dice
-- «Todavía nadie pidió a esta cría» (FR-023). La portada de una cría sin fotos es la de su camada.
create function public.publisher_inbox()
returns table (
  pet_id uuid,
  code text,
  name text,
  sex text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  waiting_count integer,
  new_count integer,
  last_sent_at timestamptz,
  litter_id uuid,
  litter_code text,
  litter_name text,
  litter_position integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with counted as (
    select a.pet_id,
           count(*) filter (where a.status = 'sent')::integer as waiting,
           count(*) filter (where a.status = 'sent' and r.opened_at is null)::integer as fresh,
           max(a.sent_at) as last_sent
      from public.applications a
      join public.pets p on p.id = a.pet_id
      left join public.application_reviews r on r.application_id = a.id
     where p.owner_id = (select auth.uid())
       and p.taken_down_at is null
     group by a.pet_id
  ),
  asked_litters as (
    select distinct p.litter_id
      from counted c
      join public.pets p on p.id = c.pet_id
     where p.litter_id is not null
  )
  select p.id, p.code, p.name, p.sex,
         ph.id, ph.owner_id, ph.width, ph.height, ph.thumbhash,
         coalesce(c.waiting, 0), coalesce(c.fresh, 0), c.last_sent,
         l.id, l.code, l.name,
         case when l.id is not null then
           (row_number() over (partition by l.id order by p.published_at, p.id))::integer
         end
    from public.pets p
    left join counted c on c.pet_id = p.id
    left join public.litters l on l.id = p.litter_id
    left join lateral private.pet_cover(p) ph on true
   where p.owner_id = (select auth.uid())
     and p.taken_down_at is null
     and (c.pet_id is not null or p.litter_id in (select x.litter_id from asked_litters x));
$$;

drop function public.inbox_pet(uuid);

-- El animal de «Solicitudes por Tobi»; de una cría, también su camada para el encabezado.
create function public.inbox_pet(p_pet uuid)
returns table (
  pet_id uuid,
  code text,
  name text,
  sex text,
  state text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  litter_code text,
  litter_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.code, p.name, p.sex,
         private.pet_state(p.status, p.expires_at, p.taken_down_at),
         ph.id, ph.owner_id, ph.width, ph.height, ph.thumbhash,
         l.code, l.name
    from public.pets p
    left join public.litters l on l.id = p.litter_id
    left join lateral private.pet_cover(p) ph on true
   where p.id = p_pet
     and p.owner_id = (select auth.uid())
     and p.taken_down_at is null;
$$;

drop function public.my_applications();

-- La de #67, con el nombre de la camada de una cría: el de hoy mientras se muestra, o el que quedó
-- copiado al cerrarse (FR-036).
create function public.my_applications()
returns table (
  id uuid,
  status text,
  close_reason text,
  sent_at timestamptz,
  changed_at timestamptz,
  code text,
  pet_name text,
  pet_on_view boolean,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  was_accepted boolean,
  waiting_question boolean,
  adoption text,
  litter_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.status, a.close_reason, a.sent_at, a.changed_at,
         v.code,
         coalesce(v.name, a.pet_name),
         coalesce(v.on_view, false),
         v.cover_id, v.cover_owner, v.cover_width, v.cover_height, v.cover_thumbhash,
         coalesce(r.accepted_at is not null, false),
         a.status in ('sent', 'accepted') and exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         ),
         case when a.close_reason = 'handed_over' then private.adoption_state(a.id) end,
         coalesce(case when v.shows then private.litter_name_of(a.pet_id) end, a.litter_name)
    from public.applications a
    left join lateral private.application_pet(a.pet_id, a.applicant_id) v on true
    left join public.application_reviews r on r.application_id = a.id
   where a.applicant_id = (select auth.uid())
   order by a.status in ('sent', 'accepted') desc, a.sent_at desc, a.id;
$$;

drop function public.my_application(uuid);

create function public.my_application(p_id uuid)
returns table (
  id uuid,
  status text,
  close_reason text,
  sent_at timestamptz,
  changed_at timestamptz,
  code text,
  pet_name text,
  pet_on_view boolean,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  publisher_name text,
  answers jsonb,
  was_accepted boolean,
  waiting_question boolean,
  adoption text,
  litter_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.status, a.close_reason, a.sent_at, a.changed_at,
         v.code,
         coalesce(v.name, a.pet_name),
         coalesce(v.on_view, false),
         v.cover_id, v.cover_owner, v.cover_width, v.cover_height, v.cover_thumbhash,
         v.publisher_name,
         a.answers,
         coalesce(r.accepted_at is not null, false),
         a.status in ('sent', 'accepted') and exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         ),
         case when a.close_reason = 'handed_over' then private.adoption_state(a.id) end,
         coalesce(case when v.shows then private.litter_name_of(a.pet_id) end, a.litter_name)
    from public.applications a
    left join lateral private.application_pet(a.pet_id, a.applicant_id) v on true
    left join public.application_reviews r on r.application_id = a.id
   where a.id = p_id
     and a.applicant_id = (select auth.uid());
$$;

drop function public.claim_application_notices(integer);

-- La de #65 con el nombre de la camada, de hoy o el copiado al cerrarse (FR-038).
create function public.claim_application_notices(p_limit integer)
returns table (
  id uuid,
  kind text,
  application_id uuid,
  recipient_id uuid,
  pet_name text,
  pet_sex text,
  litter_name text
)
language sql
security definer
set search_path = ''
as $$
  with picked as (
    select n.id
      from public.application_notices n
     order by n.created_at
     limit p_limit
       for update skip locked
  ),
  claimed as (
    delete from public.application_notices n
     using picked
     where n.id = picked.id
    returning n.id, n.kind, n.application_id, n.recipient_id
  )
  select c.id, c.kind, c.application_id, c.recipient_id, coalesce(p.name, a.pet_name), p.sex,
         coalesce(l.name, a.litter_name)
    from claimed c
    join public.applications a on a.id = c.application_id
    left join public.pets p on p.id = a.pet_id
    left join public.litters l on l.id = p.litter_id;
$$;

drop function public.accept_application(uuid, uuid);

-- La de #65 con `in_litter`, para medir la aceptación de una cría con la marca de camada (R12).
create function public.accept_application(p_publisher uuid, p_id uuid)
returns table (
  outcome text,
  first_response boolean,
  sent_at timestamptz,
  close_reason text,
  in_litter boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.applications%rowtype;
  v_first boolean;
  v_in_litter boolean;
begin
  select * into v_app
    from public.applications a
   where a.id = p_id
     and a.publisher_id = p_publisher
     for update;
  if not found then
    return query select 'not_found', false, null::timestamptz, null::text, false;
    return;
  end if;
  v_in_litter := exists (
    select 1 from public.pets p where p.id = v_app.pet_id and p.litter_id is not null
  );
  if v_app.status = 'accepted' then
    return query select 'already_accepted', false, v_app.sent_at, null::text, v_in_litter;
    return;
  end if;
  if v_app.status = 'rejected' then
    return query select 'rejected', false, v_app.sent_at, null::text, v_in_litter;
    return;
  end if;
  if v_app.status <> 'sent' then
    return query select private.not_answerable(v_app), false, v_app.sent_at, v_app.close_reason,
                        v_in_litter;
    return;
  end if;
  if not public.identity_level_one(p_publisher, private.pending_ttl()) then
    return query select 'publisher_needs_phone', false, v_app.sent_at, null::text, v_in_litter;
    return;
  end if;
  if not public.identity_level_one(v_app.applicant_id, private.pending_ttl()) then
    return query select 'applicant_needs_phone', false, v_app.sent_at, null::text, v_in_litter;
    return;
  end if;

  update public.applications a
     set status = 'accepted', changed_at = now()
   where a.id = p_id;

  v_first := not exists (
    select 1
      from public.application_reviews r
     where r.application_id = p_id
       and r.first_response_at is not null
  );
  insert into public.application_reviews as r (application_id, accepted_at, first_response_at)
  values (p_id, now(), now())
  on conflict (application_id) do update
    set accepted_at = now(),
        first_response_at = coalesce(r.first_response_at, now());

  insert into public.application_notices (kind, application_id, recipient_id)
  values ('accepted', p_id, v_app.applicant_id);

  return query select 'accepted', v_first, v_app.sent_at, null::text, v_in_litter;
end;
$$;

-- Permisos ---------------------------------------------------------------------------------------

revoke all on function private.pets_clear_resume_status() from public, anon, authenticated;
revoke all on function private.litters_sync_young_expiry() from public, anon, authenticated;
revoke all on function private.litter_state(public.litters) from public, anon, authenticated;
revoke all on function private.litter_name_of(uuid) from public, anon, authenticated;
revoke all on function public.publisher_inbox() from public, anon, authenticated;
revoke all on function public.inbox_pet(uuid) from public, anon, authenticated;
revoke all on function public.my_applications() from public, anon, authenticated;
revoke all on function public.my_application(uuid) from public, anon, authenticated;
revoke all on function public.claim_application_notices(integer) from public, anon, authenticated;
revoke all on function public.accept_application(uuid, uuid) from public, anon, authenticated;

grant execute on function public.publisher_inbox() to authenticated;
grant execute on function public.inbox_pet(uuid) to authenticated;
grant execute on function public.my_applications() to authenticated;
grant execute on function public.my_application(uuid) to authenticated;
grant execute on function public.claim_application_notices(integer) to service_role;
grant execute on function public.accept_application(uuid, uuid) to service_role;

-- Marcar cada cría (US2) ---------------------------------------------------------------------------

-- El estado propio de una cría: pausada es el de su camada, y la cría guarda a dónde vuelve (R2).
create function private.young_state(p public.pets)
returns text
language sql
stable
set search_path = ''
as $$
  select case when p.status = 'paused' then coalesce(p.resume_status, 'available') else p.status end;
$$;

-- Disponibles son solo las crías en ese estado (FR-016); con la camada pausada, las que vuelven
-- disponibles, así la dueña ve el recuento que va a tener al reanudar.
create or replace function private.litter_available_count(p_litter uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
    from public.pets p
   where p.litter_id = p_litter
     and private.young_state(p) = 'available';
$$;

-- Marcar en proceso o disponible una cría (R4), sin nivel 1 y solo con la camada disponible (Edge
-- Cases). Disponible desde adoptada termina su adopción como volver a publicar un animal adoptado
-- (FR-007). La camada y la cría se toman con el candado de la cuenta: dos pestañas se ordenan y gana
-- la primera (FR-009). `code` es el de la camada, a cuya ficha lleva la cría.
create function public.change_young_status(p_owner uuid, p_pet uuid, p_action text)
returns table (
  outcome text,
  code text,
  litter_id uuid,
  name text,
  sex text,
  litter_name text,
  from_state text,
  state text,
  litter_state text,
  published_at timestamptz,
  ended_marked_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet public.pets%rowtype;
  v_litter public.litters%rowtype;
  v_from text;
  v_litter_state text;
  v_target text;
  v_ended timestamptz;
begin
  if p_action not in ('mark_in_process', 'mark_available') then
    raise exception using errcode = 'P0001', message = 'invalid_action';
  end if;

  perform public.lock_phone_account(p_owner);

  select * into v_pet
    from public.pets p
   where p.id = p_pet and p.owner_id = p_owner and p.litter_id is not null
     for update;
  if not found then
    return query select 'not_found', null::text, null::uuid, null::text, null::text, null::text,
                        null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  select * into v_litter from public.litters l where l.id = v_pet.litter_id for update;
  v_from := private.young_state(v_pet);
  v_litter_state := private.litter_state(v_litter);

  if v_litter_state = 'taken_down' then
    return query select 'taken_down', v_litter.code, v_litter.id, v_pet.name, v_pet.sex,
                        v_litter.name, v_from, v_from, v_litter_state, v_pet.published_at,
                        null::timestamptz;
    return;
  end if;

  if (p_action, v_from) in (('mark_in_process', 'in_process'), ('mark_available', 'available')) then
    return query select 'already', v_litter.code, v_litter.id, v_pet.name, v_pet.sex,
                        v_litter.name, v_from, v_from, v_litter_state, v_pet.published_at,
                        null::timestamptz;
    return;
  end if;

  v_target := case
                when v_litter_state <> 'available' then null
                when p_action = 'mark_in_process' and v_from = 'available' then 'in_process'
                when p_action = 'mark_available' and v_from in ('in_process', 'adopted')
                  then 'available'
              end;

  if v_target is null then
    return query select 'changed', v_litter.code, v_litter.id, v_pet.name, v_pet.sex,
                        v_litter.name, v_from, v_from, v_litter_state, v_pet.published_at,
                        null::timestamptz;
    return;
  end if;

  update public.pets p
     set status = v_target,
         status_changed_at = now(),
         expires_at = v_litter.expires_at
   where p.id = p_pet
  returning * into v_pet;

  if v_from = 'adopted' then
    update public.adoptions d
       set ended_at = now()
     where d.pet_id = p_pet
       and d.ended_at is null
    returning case
                when d.kind = 'site' and d.adopter_id is not null and d.declined_at is null
                  then d.marked_at
              end into v_ended;
  end if;

  return query select 'done', v_litter.code, v_litter.id, v_pet.name, v_pet.sex, v_litter.name,
                      v_from, private.young_state(v_pet), private.litter_state(v_litter),
                      v_pet.published_at, v_ended;
end;
$$;

-- El listado (R6): una camada sale mientras está disponible entera (FR-015), con el recuento de sus
-- crías disponibles y el sello «En proceso» cuando no queda ninguna disponible y alguna está en
-- proceso (FR-016). El filtro de sexo mira las crías disponibles y en proceso (FR-017).
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
     and (p_after_published is null or (s.published_at, s.code) < (p_after_published, p_after_code))
   order by s.published_at desc, s.code desc
   limit least(greatest(coalesce(p_limit, 25), 1), 241);
$$;

-- La de #205 con el estado de la camada y el de cada cría (R6): la ficha pone sus sellos, el recuento
-- y, a una adoptada entera, su sello y una vista previa que lo dice (FR-018, FR-020).
drop function public.litter_by_code(text);

create function public.litter_by_code(p_code text)
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

  v_visibility := case when private.litter_is_shown(v_litter) then 'listed' else 'hidden' end;

  if not v_owner and v_visibility = 'hidden' then
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
             private.litter_state(v_litter) = 'adopted'
           ),
           pr.display_name, pr.avatar_path, pr.is_rescuer,
           case
             when v_visibility = 'listed' then private.publisher_level(v_litter.owner_id)
           end,
           case when v_owner then v_litter.takedown_reason end,
           case when v_owner then v_litter.takedown_note end,
           null::text,
           private.litter_state(v_litter)
      from (select 1) as one
      left join public.profiles pr on pr.id = v_litter.owner_id;
end;
$$;


-- La de #67 con la camada de una cría (R12): `in_litter` para medir la entrega con la marca de camada,
-- y su id y código para volver a su panel y revalidar su ficha. La elegida guarda también el nombre
-- de la camada al cerrarse (R8).
drop function public.mark_pet_adopted(uuid, uuid, uuid, uuid);

create function public.mark_pet_adopted(
  p_owner uuid,
  p_pet uuid,
  p_attempt uuid,
  p_application uuid default null
)
returns table (
  outcome text,
  detail text,
  code text,
  name text,
  sex text,
  from_state text,
  published_at timestamptz,
  accepted_at timestamptz,
  accepted_count integer,
  in_litter boolean,
  litter_id uuid,
  litter_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet public.pets%rowtype;
  v_from text;
  v_app public.applications%rowtype;
  v_accepted timestamptz;
  v_count integer;
  v_name text;
  v_done public.adoptions%rowtype;
  v_litter_code text;
begin
  perform public.lock_phone_account(p_owner);

  select * into v_pet from public.pets p where p.id = p_pet and p.owner_id = p_owner for update;
  if not found then
    return query select 'not_found', null::text, null::text, null::text, null::text, null::text,
                        null::timestamptz, null::timestamptz, 0, false, null::uuid, null::text;
    return;
  end if;

  v_from := private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at);
  v_litter_code := (select l.code from public.litters l where l.id = v_pet.litter_id);

  select * into v_done from public.adoptions d where d.pet_id = p_pet and d.attempt_id = p_attempt;
  if found then
    return query
      select 'already',
             (select pr.display_name from public.profiles pr where pr.id = v_done.adopter_id),
             v_pet.code, v_pet.name, v_pet.sex, v_from, v_pet.published_at, null::timestamptz, 0,
             v_pet.litter_id is not null, v_pet.litter_id, v_litter_code;
    return;
  end if;

  if not private.pet_can_hand_over(v_from) then
    return query select 'changed', null::text, v_pet.code, v_pet.name, v_pet.sex, v_from,
                        v_pet.published_at, null::timestamptz, 0,
             v_pet.litter_id is not null, v_pet.litter_id, v_litter_code;
    return;
  end if;

  select count(*)::integer into v_count
    from public.applications a
   where a.pet_id = p_pet
     and a.status = 'accepted';

  if p_application is not null then
    select * into v_app
      from public.applications a
     where a.id = p_application
       and a.pet_id = p_pet
       and a.publisher_id = p_owner
       for update;
    select pr.display_name into v_name from public.profiles pr where pr.id = v_app.applicant_id;
    select r.accepted_at into v_accepted
      from public.application_reviews r
     where r.application_id = v_app.id;

    if v_app.id is null or v_app.status = 'sent' or v_accepted is null then
      return query select 'not_found', null::text, v_pet.code, v_pet.name, v_pet.sex, v_from,
                          v_pet.published_at, null::timestamptz, v_count,
             v_pet.litter_id is not null, v_pet.litter_id, v_litter_code;
      return;
    end if;
    if v_app.status <> 'accepted' then
      return query
        select case
                 when v_app.status = 'rejected' then 'revoked'
                 when private.not_answerable(v_app) = 'closed' then 'changed'
                 else private.not_answerable(v_app)
               end,
               v_name, v_pet.code, v_pet.name, v_pet.sex, v_from, v_pet.published_at,
               null::timestamptz, v_count,
             v_pet.litter_id is not null, v_pet.litter_id, v_litter_code;
      return;
    end if;

    insert into public.adoptions (
      pet_id, publisher_id, kind, application_id, adopter_id, includes_neuter, attempt_id
    )
    values (p_pet, p_owner, 'site', v_app.id, v_app.applicant_id, v_pet.is_neutered is not true, p_attempt);

    update public.applications a
       set status = 'closed', close_reason = 'handed_over', changed_at = now(), pet_name = v_pet.name,
           litter_name = private.litter_name_of(v_pet.id)
     where a.id = v_app.id;

    insert into public.application_notices (kind, application_id, recipient_id)
    values ('adoption_marked', v_app.id, v_app.applicant_id);
  else
    insert into public.adoptions (pet_id, publisher_id, kind, attempt_id)
    values (p_pet, p_owner, 'outside', p_attempt);
  end if;

  -- Como lo hacía `change_pet_status`: el disparador de #63/#65 cierra las otras como que encontró
  -- hogar y escribe sus correos; la elegida ya está cerrada y no recibe el suyo (FR-050).
  update public.pets p
     set status = 'adopted',
         status_changed_at = now(),
         expires_at = null
   where p.id = p_pet;

  return query select 'done', v_name, v_pet.code, v_pet.name, v_pet.sex, v_from,
                      v_pet.published_at, v_accepted, v_count,
             v_pet.litter_id is not null, v_pet.litter_id, v_litter_code;
end;
$$;

-- La vista previa de una camada adoptada lleva su portada y su nombre y dice que fue adoptada, como
-- la de un animal adoptado (FR-020).
drop function public.litter_share_card(text);

create function public.litter_share_card(p_code text)
returns table (
  name text,
  department text,
  locality text,
  adopted boolean,
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
  select l.name, l.department, l.locality, s.state = 'adopted', ph.id, ph.owner_id, ph.width,
         ph.height,
         private.pet_share_version(ph.id, l.name, l.department, l.locality, s.state = 'adopted')
    from public.litters l
    cross join lateral (select private.litter_state(l) as state) s
    join public.pet_photos ph on ph.litter_id = l.id and ph.position = 0
   where l.code = p_code
     and private.litter_is_shown(l);
$$;

-- «¿A quién se la diste?» de una cría: el nombre de su camada para el compromiso y su id para volver a
-- su panel (FR-028).
drop function public.handover_pet(uuid);

create function public.handover_pet(p_pet uuid)
returns table (
  pet_id uuid,
  name text,
  sex text,
  code text,
  state text,
  is_neutered boolean,
  publisher_name text,
  litter_id uuid,
  litter_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.sex, p.code,
         private.pet_state(p.status, p.expires_at, p.taken_down_at),
         p.is_neutered,
         pr.display_name,
         l.id,
         l.name
    from public.pets p
    left join public.profiles pr on pr.id = p.owner_id
    left join public.litters l on l.id = p.litter_id
   where p.id = p_pet
     and p.owner_id = (select auth.uid());
$$;

-- El correo del compromiso nombra a la cría con su camada (FR-038): la de hoy o la copiada al cerrarse.
drop function public.commitment_for_email(uuid, uuid);

create function public.commitment_for_email(p_application uuid, p_recipient uuid)
returns table (
  side text,
  pet_name text,
  pet_sex text,
  pet_code text,
  cover_id uuid,
  includes_neuter boolean,
  publisher_name text,
  adopter_name text,
  marked_at timestamptz,
  adopter_accepted_at timestamptz,
  litter_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select case when d.publisher_id = p_recipient then 'publisher' else 'adopter' end,
         coalesce(p.name, a.pet_name),
         p.sex,
         v.code,
         v.cover_id,
         d.includes_neuter,
         pp.display_name,
         pa.display_name,
         d.marked_at,
         d.adopter_accepted_at,
         coalesce(l.name, a.litter_name)
    from public.adoptions d
    join public.applications a on a.id = d.application_id
    left join public.pets p on p.id = d.pet_id
    left join public.litters l on l.id = p.litter_id
    left join lateral private.application_pet(d.pet_id, p_recipient) v on true
    left join public.profiles pp on pp.id = d.publisher_id
    left join public.profiles pa on pa.id = d.adopter_id
   where d.application_id = p_application
     and p_recipient in (d.publisher_id, d.adopter_id)
   order by d.marked_at desc
   limit 1;
$$;

-- «Ana contó cómo va <cría>»: con su camada en el texto y su id para llevar al panel de la camada.
drop function public.follow_up_answered_for_email(uuid, uuid);

create function public.follow_up_answered_for_email(p_application uuid, p_recipient uuid)
returns table (
  adopter_name text,
  pet_name text,
  pet_sex text,
  pet_id uuid,
  follow_up_id uuid,
  first_photo_id uuid,
  litter_id uuid,
  litter_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select pa.display_name,
         coalesce(p.name, a.pet_name),
         p.sex,
         p.id,
         f.id,
         ph.id,
         l.id,
         coalesce(l.name, a.litter_name)
    from (
      select d.*
        from public.adoptions d
       where d.application_id = p_application
         and d.publisher_id = p_recipient
       order by d.marked_at desc
       limit 1
    ) d
    join public.follow_ups f on f.adoption_id = d.id and f.status = 'answered'
    join public.applications a on a.id = d.application_id
    join public.profiles pa on pa.id = f.adopter_id
    left join public.pets p on p.id = d.pet_id
    left join public.litters l on l.id = p.litter_id
    left join public.follow_up_photos ph on ph.follow_up_id = f.id and ph.position = 1
   where d.blocked_at is null;
$$;

revoke all on function private.young_state(public.pets) from public, anon, authenticated;
revoke all on function public.change_young_status(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
) from public, anon, authenticated;
revoke all on function public.litter_by_code(text) from public, anon, authenticated;
revoke all on function public.litter_share_card(text) from public, anon, authenticated;
revoke all on function public.mark_pet_adopted(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.handover_pet(uuid) from public, anon, authenticated;
revoke all on function public.commitment_for_email(uuid, uuid) from public, anon, authenticated;
revoke all on function public.follow_up_answered_for_email(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.change_young_status(uuid, uuid, text) to service_role;
grant execute on function public.listed_pets(
  text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer
) to anon, authenticated;
grant execute on function public.litter_by_code(text) to anon, authenticated;
grant execute on function public.litter_share_card(text) to anon, authenticated;
grant execute on function public.mark_pet_adopted(uuid, uuid, uuid, uuid) to service_role;
grant execute on function public.handover_pet(uuid) to authenticated;
grant execute on function public.commitment_for_email(uuid, uuid) to service_role;
grant execute on function public.follow_up_answered_for_email(uuid, uuid) to service_role;
