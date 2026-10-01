-- El nivel de quien publica, en la ficha, con la misma escalera que el perfil público de la #12:
-- nivel 2 es `private.has_level_two`; nivel 3, además un aval de alguien que hoy tiene nivel 2 (lo
-- mismo con lo que `public_profile` cuenta los avales). Sin nivel 1 la ficha no está a la vista, así
-- que el caso «a la vista» ya es nivel 1. Solo cambia `publisher_level`.
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
             when not private.has_level_two(v_pet.owner_id, private.pending_ttl()) then 1::smallint
             when exists (
               select 1
                 from public.vouches x
                where x.vouchee_id = v_pet.owner_id
                  and private.has_level_two(x.voucher_id, private.pending_ttl())
             ) then 3::smallint
             else 2::smallint
           end
      from (select 1) as one
      left join public.profiles pr on pr.id = v_pet.owner_id;
end;
$$;

