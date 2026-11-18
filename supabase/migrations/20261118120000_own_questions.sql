-- La pregunta propia de quien publica (historia #292): una por animal o por camada, que quien
-- solicita contesta en el cuestionario. Vive en `pets` (un animal sin camada) y en `litters`; una
-- cría usa la de su camada, leída en el momento (research R1). Cada solicitud guarda aparte la
-- pregunta tal como se contestó y la respuesta, así cambiarla o sacarla no toca lo que ya llegó (R2).

-- Sin `revoke`: la usan los `check` de las tablas, que corren con el rol de quien escribe.
create or replace function private.own_question_max_length()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 200;
$$;

-- ---------------------------------------------------------------------------------------------
-- Las columnas
-- ---------------------------------------------------------------------------------------------

alter table public.pets
  add column own_question text,
  add constraint pets_own_question_valid check (
    own_question is null or (
      char_length(own_question) between 1 and private.own_question_max_length()
      and own_question = btrim(own_question)
      and own_question ~ '[^[:space:]]'
    )
  ),
  -- Una cría contesta la de su camada: no tiene una propia que pueda quedar distinta.
  add constraint pets_own_question_not_young check (litter_id is null or own_question is null);

alter table public.litters
  add column own_question text,
  add constraint litters_own_question_valid check (
    own_question is null or (
      char_length(own_question) between 1 and private.own_question_max_length()
      and own_question = btrim(own_question)
      and own_question ~ '[^[:space:]]'
    )
  );

alter table public.applications
  add column own_question text,
  add column own_answer text,
  add constraint applications_own_pair check ((own_question is null) = (own_answer is null)),
  add constraint applications_own_question_length check (
    own_question is null
    or char_length(own_question) between 1 and private.own_question_max_length()
  ),
  add constraint applications_own_answer_valid check (
    own_answer is null or (
      char_length(own_answer) between 1 and private.answer_max_length()
      and own_answer ~ '[^[:space:]]'
    )
  );

alter table public.held_applications
  add column own_question text,
  add column own_answer text,
  add constraint held_applications_own_pair check ((own_question is null) = (own_answer is null)),
  add constraint held_applications_own_question_length check (
    own_question is null
    or char_length(own_question) between 1 and private.own_question_max_length()
  ),
  add constraint held_applications_own_answer_valid check (
    own_answer is null or (
      char_length(own_answer) between 1 and private.answer_max_length()
      and own_answer ~ '[^[:space:]]'
    )
  );

-- Al no salir, la respuesta propia se pierde con las demás.
alter table public.held_applications
  drop constraint held_applications_answers_while_waiting,
  add constraint held_applications_answers_while_waiting check (
    (status = 'waiting') = (answers is not null)
    and (status = 'waiting' or (own_question is null and own_answer is null))
  );

comment on column public.pets.own_question is
  'La pregunta propia de quien publica, solo de un animal sin camada. No es pública (#292).';
comment on column public.litters.own_question is
  'La pregunta propia de la camada, que contesta quien solicita cualquiera de sus crías (#292).';
comment on column public.applications.own_question is
  'La pregunta propia tal como estaba al mandar la solicitud; no cambia si después se cambia.';

-- La pregunta que hoy contesta quien solicita este animal: la de su camada si es una cría.
create or replace function private.pet_own_question(p public.pets)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when p.litter_id is null then p.own_question
           else (select l.own_question from public.litters l where l.id = p.litter_id)
         end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Publicar y editar un animal (research R8): la firma no cambia, la pregunta viaja en `p_fields`
-- ---------------------------------------------------------------------------------------------

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

  select p.id into v_pet from public.pets p where p.owner_id = p_owner and p.attempt_id = p_attempt;
  if v_pet is not null then
    return query select v_pet, true;
    return;
  end if;

  if not public.identity_level_one(p_owner, p_pending_ttl) then
    raise exception using errcode = 'P0001', message = 'needs_verification';
  end if;

  select count(distinct ph.id) into v_ready
    from public.pet_photos ph
   where ph.id = any (p_photo_ids)
     and ph.owner_id = p_owner
     and ph.pet_id is null
     and ph.litter_id is null
     and ph.released_at is null
     and ph.staged_at > now() - p_staged_ttl;

  if v_count not between 1 and 5 or v_ready <> v_count then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  insert into public.pets (
    owner_id, attempt_id, name, species, sex, age_value, age_unit, age_as_of, size, is_neutered,
    vaccines, has_chip, good_with_kids, good_with_dogs, good_with_cats, description, department,
    locality, is_urgent, required_level, own_question, expires_at
  )
  values (
    p_owner, p_attempt, p_fields ->> 'name', p_fields ->> 'species', p_fields ->> 'sex',
    (p_fields ->> 'age_value')::smallint, p_fields ->> 'age_unit',
    (p_fields ->> 'age_as_of')::date, p_fields ->> 'size', (p_fields ->> 'is_neutered')::boolean,
    p_fields ->> 'vaccines', (p_fields ->> 'has_chip')::boolean, p_fields ->> 'good_with_kids',
    p_fields ->> 'good_with_dogs', p_fields ->> 'good_with_cats', p_fields ->> 'description',
    p_fields ->> 'department', p_fields ->> 'locality', (p_fields ->> 'is_urgent')::boolean,
    coalesce((p_fields ->> 'required_level')::smallint, 1),
    nullif(btrim(p_fields ->> 'own_question'), ''),
    now() + private.pet_lifetime()
  )
  returning id into v_pet;

  update public.pet_photos ph
     set pet_id = v_pet, position = o.ord - 1
    from unnest(p_photo_ids) with ordinality as o (id, ord)
   where ph.id = o.id;

  return query select v_pet, false;
end;
$$;

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
  v_taken_down_at timestamptz;
begin
  perform public.lock_phone_account(p_owner);

  select p.taken_down_at into v_taken_down_at
    from public.pets p
   where p.id = p_pet and p.owner_id = p_owner;
  if not found then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  perform private.reject_litter_young(p_pet);

  if v_taken_down_at is not null then
    raise exception using errcode = 'P0001', message = 'taken_down';
  end if;

  if not public.identity_level_one(p_owner, p_pending_ttl) then
    raise exception using errcode = 'P0001', message = 'needs_verification';
  end if;

  if v_count not between 1 and 5
     or (select count(distinct x) from unnest(p_photo_ids) as x) <> v_count then
    raise exception using errcode = 'P0001', message = 'photos_invalid';
  end if;

  -- Una foto de la pantalla que ya no está enganchada a este animal ni en espera: otra pestaña la
  -- sacó, y guardar ahora no dejaría el animal como se ve (FR-020a de la #53).
  select count(*) into v_known
    from public.pet_photos ph
   where ph.id = any (p_photo_ids)
     and ph.owner_id = p_owner
     and (
       ph.pet_id = p_pet
       or (ph.pet_id is null and ph.litter_id is null and ph.released_at is null)
     );
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
         is_urgent = (p_fields ->> 'is_urgent')::boolean,
         required_level = coalesce((p_fields ->> 'required_level')::smallint, 1),
         own_question = nullif(btrim(p_fields ->> 'own_question'), '')
   where p.id = p_pet;

  insert into public.pet_reviews as r (pet_id, pending_kind, pending_since)
  values (p_pet, 'edited', now())
  on conflict (pet_id) do update
    set pending_kind = 'edited', pending_since = now()
    where r.pending_kind is null;

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

-- ---------------------------------------------------------------------------------------------
-- Publicar y editar una camada (research R1, R8): la pregunta es de la camada y viaja en
-- `p_fields`; las crías no la copian, la leen de la camada con `private.pet_own_question`, así una
-- cría sumada después la tiene sin más (FR-014). Lo demás, como en 20261026120000_litter_lifecycle.
-- ---------------------------------------------------------------------------------------------

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
    locality, is_urgent, required_level, delivers_from, own_question
  )
  values (
    p_owner, p_attempt, p_fields ->> 'name', p_fields ->> 'species',
    (p_fields ->> 'age_value')::smallint, p_fields ->> 'age_unit',
    (p_fields ->> 'age_as_of')::date, p_fields ->> 'size', (p_fields ->> 'is_neutered')::boolean,
    p_fields ->> 'vaccines', (p_fields ->> 'has_chip')::boolean, p_fields ->> 'good_with_kids',
    p_fields ->> 'good_with_dogs', p_fields ->> 'good_with_cats', p_fields ->> 'description',
    p_fields ->> 'department', p_fields ->> 'locality', (p_fields ->> 'is_urgent')::boolean,
    coalesce((p_fields ->> 'required_level')::smallint, 1), v_delivers,
    nullif(btrim(p_fields ->> 'own_question'), '')
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
         delivers_from = v_delivers,
         own_question = nullif(btrim(p_fields ->> 'own_question'), '')
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

-- ---------------------------------------------------------------------------------------------
-- Mandar una solicitud con la pregunta propia (research R3)
-- ---------------------------------------------------------------------------------------------

drop function public.submit_application(uuid, uuid, text, jsonb, interval);

-- `p_own_question` es la pregunta que la persona tenía en pantalla. Si hoy es otra (cambió, o se
-- sumó mientras escribía), no se guarda nada y vuelve la de hoy: una respuesta nunca queda al lado
-- de una pregunta que la persona no vio. Si hoy no hay pregunta, lo recibido se ignora. Las dos van
-- al final y nulas por omisión: sin pregunta en pantalla, la aplicación no las manda.
create function public.submit_application(
  p_applicant uuid,
  p_attempt uuid,
  p_code text,
  p_answers jsonb,
  p_pending_ttl interval,
  p_own_question text default null,
  p_own_answer text default null
)
returns table (outcome text, application_id uuid, own_question text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_saved text;
  v_pet public.pets%rowtype;
  v_receiving text;
  v_question text;
  v_answer text;
begin
  perform public.lock_phone_account(p_applicant);

  select a.id, a.own_question into v_id, v_saved
    from public.applications a
   where a.applicant_id = p_applicant
     and a.attempt_id = p_attempt;
  if v_id is not null then
    return query select 'already', v_id, v_saved;
    return;
  end if;

  select * into v_pet from public.pets p where p.code = p_code;
  if not found then
    return query select 'not_found', null::uuid, null::text;
    return;
  end if;
  if v_pet.owner_id = p_applicant then
    return query select 'own', null::uuid, null::text;
    return;
  end if;
  if exists (
    select 1 from public.blocks b where b.blocker_id = p_applicant and b.blocked_id = v_pet.owner_id
  ) then
    return query select 'you_blocked', null::uuid, null::text;
    return;
  end if;

  v_receiving := private.pet_receives_applications(v_pet);
  if v_receiving = 'unavailable' then
    return query select 'unavailable', null::uuid, null::text;
    return;
  end if;
  if v_receiving = 'closed' or exists (
    select 1 from public.blocks b where b.blocker_id = v_pet.owner_id and b.blocked_id = p_applicant
  ) then
    return query select 'not_receiving', null::uuid, null::text;
    return;
  end if;

  select a.id into v_id
    from public.applications a
   where a.applicant_id = p_applicant
     and a.pet_id = v_pet.id
     and a.status in ('sent', 'accepted');
  if v_id is not null then
    return query select 'has_active', v_id, null::text;
    return;
  end if;

  if exists (
    select 1
      from public.held_applications h
     where h.applicant_id = p_applicant
       and h.pet_id = v_pet.id
       and h.status = 'waiting'
  ) then
    return query select 'has_held', null::uuid, null::text;
    return;
  end if;

  if exists (
    select 1
      from public.applications a
     where a.applicant_id = p_applicant
       and a.pet_id = v_pet.id
       and a.status = 'rejected'
  ) then
    return query select 'rejected', null::uuid, null::text;
    return;
  end if;

  if private.active_application_count(p_applicant) >= private.max_active_applications() then
    return query select 'limit', null::uuid, null::text;
    return;
  end if;

  if not public.identity_level_one(p_applicant, p_pending_ttl) then
    return query select 'needs_phone', null::uuid, null::text;
    return;
  end if;
  if v_pet.required_level = 2 and not private.has_level_two(p_applicant, p_pending_ttl) then
    return query select 'needs_identity', null::uuid, null::text;
    return;
  end if;

  v_question := private.pet_own_question(v_pet);
  if v_question is not null then
    if p_own_question is null or btrim(p_own_question) <> v_question then
      return query select 'question_changed', null::uuid, v_question;
      return;
    end if;
    if p_own_answer is null
       or char_length(p_own_answer) not between 1 and private.answer_max_length()
       or p_own_answer !~ '[^[:space:]]' then
      return query select 'answers_invalid', null::uuid, null::text;
      return;
    end if;
    v_answer := p_own_answer;
  end if;

  if not private.application_answers_valid(p_answers, v_pet.is_neutered) then
    return query select 'answers_invalid', null::uuid, null::text;
    return;
  end if;

  insert into public.applications (
    applicant_id, pet_id, publisher_id, attempt_id, answers, pet_name, own_question, own_answer
  )
  values (
    p_applicant, v_pet.id, v_pet.owner_id, p_attempt, p_answers, v_pet.name, v_question, v_answer
  )
  returning id into v_id;

  perform private.queue_new_application_notice(v_id);

  return query select 'sent', v_id, v_question;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Lo que se lee: la pregunta de hoy al abrir el cuestionario y la contestada en cada solicitud
-- ---------------------------------------------------------------------------------------------

drop function public.apply_context(uuid, text, interval);

-- Corre con la clave de servicio y trae la pregunta aunque la persona todavía no pasó los frenos:
-- la página la pasa al formulario solo en la rama que dibuja el cuestionario (FR-010).
create function public.apply_context(p_applicant uuid, p_code text, p_pending_ttl interval)
returns table (
  is_owner boolean,
  receiving text,
  state text,
  is_neutered boolean,
  required_level smallint,
  code text,
  name text,
  publisher_name text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  blocked_by_publisher boolean,
  blocked_publisher boolean,
  my_active_id uuid,
  my_held_id uuid,
  my_rejected boolean,
  active_count integer,
  level_one boolean,
  level_two boolean,
  level smallint,
  identity_pending_since timestamptz,
  last_answers jsonb,
  active jsonb,
  own_question text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.owner_id = p_applicant,
         private.pet_receives_applications(p),
         private.pet_state(p.status, p.expires_at, p.taken_down_at),
         p.is_neutered,
         p.required_level,
         p.code,
         p.name,
         pr.display_name,
         ph.id, ph.owner_id, ph.width, ph.height, ph.thumbhash,
         exists (
           select 1 from public.blocks b where b.blocker_id = p.owner_id and b.blocked_id = p_applicant
         ),
         exists (
           select 1 from public.blocks b where b.blocker_id = p_applicant and b.blocked_id = p.owner_id
         ),
         (
           select a.id
             from public.applications a
            where a.applicant_id = p_applicant
              and a.pet_id = p.id
              and a.status in ('sent', 'accepted')
         ),
         (
           select h.id
             from public.held_applications h
            where h.applicant_id = p_applicant
              and h.pet_id = p.id
              and h.status = 'waiting'
         ),
         exists (
           select 1
             from public.applications a
            where a.applicant_id = p_applicant
              and a.pet_id = p.id
              and a.status = 'rejected'
         ),
         private.active_application_count(p_applicant),
         l.level_one,
         private.has_level_two(p_applicant, p_pending_ttl),
         case when l.level_one then private.publisher_level(p_applicant) else 0::smallint end,
         (
           select r.sent_at
             from public.identity_requests r
            where r.user_id = p_applicant
              and r.expires_at > now()
         ),
         -- Las propuestas salen solo de `answers`: la respuesta propia es de ese animal (FR-013).
         (
           select w.answers
             from (
               select a.answers, a.sent_at as at
                 from public.applications a
                where a.applicant_id = p_applicant
               union all
               select h.answers, h.written_at
                 from public.held_applications h
                where h.applicant_id = p_applicant
                  and h.status = 'waiting'
             ) w
            order by w.at desc
            limit 1
         ),
         coalesce(
           (
             select jsonb_agg(x.item order by x.at desc)
               from (
                 select a.sent_at as at,
                        jsonb_build_object(
                          'id', a.id,
                          'sent_at', a.sent_at,
                          'held', false,
                          'code', v.code,
                          'name', coalesce(v.name, a.pet_name),
                          'cover_id', v.cover_id,
                          'cover_owner', v.cover_owner,
                          'cover_width', v.cover_width,
                          'cover_height', v.cover_height,
                          'cover_thumbhash', v.cover_thumbhash,
                          'litter_name', coalesce(
                            case when v.shows then private.litter_name_of(a.pet_id) end,
                            a.litter_name
                          )
                        ) as item
                   from public.applications a
                   left join lateral private.application_pet(a.pet_id, p_applicant) v on true
                  where a.applicant_id = p_applicant
                    and a.status in ('sent', 'accepted')
                 union all
                 select h.written_at,
                        jsonb_build_object(
                          'id', h.id,
                          'sent_at', h.written_at,
                          'held', true,
                          'code', v.code,
                          'name', coalesce(v.name, h.pet_name),
                          'cover_id', v.cover_id,
                          'cover_owner', v.cover_owner,
                          'cover_width', v.cover_width,
                          'cover_height', v.cover_height,
                          'cover_thumbhash', v.cover_thumbhash,
                          'litter_name', coalesce(
                            case when v.shows then private.litter_name_of(h.pet_id) end,
                            h.litter_name
                          )
                        )
                   from public.held_applications h
                   left join lateral private.application_pet(h.pet_id, p_applicant) v on true
                  where h.applicant_id = p_applicant
                    and h.status = 'waiting'
               ) x
           ),
           '[]'::jsonb
         ),
         private.pet_own_question(p)
    from public.pets p
    cross join lateral (
      select public.identity_level_one(p_applicant, p_pending_ttl) as level_one
    ) l
    left join public.profiles pr on pr.id = p.owner_id
    left join lateral private.pet_cover(p) ph on true
   where p.code = p_code;
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
  litter_name text,
  identity_asked boolean,
  identity_resolved_at timestamptz,
  publisher_level smallint,
  own_question text,
  own_answer text
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
         coalesce(case when v.shows then private.litter_name_of(a.pet_id) end, a.litter_name),
         a.status = 'sent' and k.application_id is not null and k.resolved_at is null,
         case when a.status = 'sent' then k.resolved_at end,
         case
           when a.status = 'sent' and k.application_id is not null
             then private.person_level(a.publisher_id)
         end,
         a.own_question,
         a.own_answer
    from public.applications a
    left join lateral private.application_pet(a.pet_id, a.applicant_id) v on true
    left join public.application_reviews r on r.application_id = a.id
    left join public.application_identity_asks k on k.application_id = a.id
   where a.id = p_id
     and a.applicant_id = (select auth.uid());
$$;

drop function public.publisher_application(uuid);

-- La pregunta contestada sigue la regla de las respuestas: sin el animal a la vista, no se lee.
create function public.publisher_application(p_id uuid)
returns table (
  id uuid,
  status text,
  publisher_close text,
  sent_at timestamptz,
  changed_at timestamptz,
  pet_id uuid,
  pet_code text,
  pet_name text,
  pet_sex text,
  pet_state text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  applicant_public_id text,
  applicant_name text,
  applicant_has_photo boolean,
  applicant_department text,
  applicant_locality text,
  applicant_level smallint,
  answers jsonb,
  opened_at timestamptz,
  accepted_at timestamptz,
  rejection_reason text,
  rejection_note text,
  applicant_has_phone boolean,
  publisher_has_phone boolean,
  questions_asked integer,
  question_pending boolean,
  identity_asked_at timestamptz,
  identity_resolved_at timestamptz,
  applicant_identity_verified boolean,
  own_question text,
  own_answer text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.status,
         case
           when not g.shows and a.status in ('withdrawn', 'closed') then 'unpublished'
           else private.publisher_close(a)
         end,
         a.sent_at, a.changed_at,
         case when g.shows then p.id end,
         case when g.shows then p.code end,
         coalesce(case when g.shows then p.name end, a.pet_name),
         p.sex,
         case when g.shows then private.pet_state(p.status, p.expires_at, p.taken_down_at) end,
         case when g.shows then ph.id end,
         case when g.shows then ph.owner_id end,
         case when g.shows then ph.width end,
         case when g.shows then ph.height end,
         case when g.shows then ph.thumbhash end,
         case when g.shows then pr.public_id end,
         case when g.shows then pr.display_name end,
         case when g.shows then pr.avatar_path is not null end,
         case when g.shows then pr.department end,
         case when g.shows then pr.locality end,
         case when g.shows then private.person_level(a.applicant_id) end,
         case when g.shows then a.answers end,
         r.opened_at, r.accepted_at, r.rejection_reason, r.rejection_note,
         public.identity_level_one(a.applicant_id, private.pending_ttl()),
         public.identity_level_one(a.publisher_id, private.pending_ttl()),
         (select count(*)::integer from public.application_questions q where q.application_id = a.id),
         exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         ),
         k.asked_at,
         k.resolved_at,
         case when g.shows then exists (
           select 1 from public.identity_verifications v where v.user_id = a.applicant_id
         ) end,
         case when g.shows then a.own_question end,
         case when g.shows then a.own_answer end
    from public.applications a
    left join public.pets p on p.id = a.pet_id
    cross join lateral (select p.id is not null and p.taken_down_at is null as shows) g
    left join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
    left join public.profiles pr on pr.id = a.applicant_id
    left join public.application_reviews r on r.application_id = a.id
    left join public.application_identity_asks k on k.application_id = a.id
   where a.id = p_id
     and a.publisher_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.pet_own_question(public.pets) from public, anon, authenticated;
revoke all on function public.submit_application(uuid, uuid, text, jsonb, interval, text, text)
  from public, anon, authenticated;
revoke all on function public.apply_context(uuid, text, interval) from public, anon, authenticated;
revoke all on function public.my_application(uuid) from public, anon, authenticated;
revoke all on function public.publisher_application(uuid) from public, anon, authenticated;

grant execute on function public.submit_application(uuid, uuid, text, jsonb, interval, text, text)
  to service_role;
grant execute on function public.apply_context(uuid, text, interval) to service_role;
grant execute on function public.my_application(uuid) to authenticated;
grant execute on function public.publisher_application(uuid) to authenticated;
