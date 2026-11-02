-- La pantalla del máximo de solicitudes activas nombra la camada de cada cría, como «Mis solicitudes»
-- (historia #278): con dos «Cría 2» de camadas distintas, quien adopta sabe cuál retira. Es el mismo
-- nombre que ya ve en `my_applications`, el de hoy si la cría se muestra o el copiado al cerrarse:
-- nadie ve algo que antes no veía. `active` es jsonb, así que la firma no cambia y los permisos
-- quedan como estaban.
create or replace function public.apply_context(
  p_applicant uuid,
  p_code text,
  p_pending_ttl interval
)
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
  my_rejected boolean,
  active_count integer,
  level_one boolean,
  level_two boolean,
  level smallint,
  identity_pending_since timestamptz,
  last_answers jsonb,
  active jsonb
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
         exists (
           select 1
             from public.applications a
            where a.applicant_id = p_applicant
              and a.pet_id = p.id
              and a.status = 'rejected'
         ),
         (
           select count(*)::integer
             from public.applications a
            where a.applicant_id = p_applicant
              and a.status in ('sent', 'accepted')
         ),
         l.level_one,
         private.has_level_two(p_applicant, p_pending_ttl),
         case when l.level_one then private.publisher_level(p_applicant) else 0::smallint end,
         (
           select r.sent_at
             from public.identity_requests r
            where r.user_id = p_applicant
              and r.expires_at > now()
         ),
         (
           select a.answers
             from public.applications a
            where a.applicant_id = p_applicant
            order by a.sent_at desc
            limit 1
         ),
         coalesce(
           (
             select jsonb_agg(
                      jsonb_build_object(
                        'id', a.id,
                        'sent_at', a.sent_at,
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
                      )
                      order by a.sent_at desc
                    )
               from public.applications a
               left join lateral private.application_pet(a.pet_id, p_applicant) v on true
              where a.applicant_id = p_applicant
                and a.status in ('sent', 'accepted')
           ),
           '[]'::jsonb
         )
    from public.pets p
    cross join lateral (
      select public.identity_level_one(p_applicant, p_pending_ttl) as level_one
    ) l
    left join public.profiles pr on pr.id = p.owner_id
    left join lateral private.pet_cover(p) ph on true
   where p.code = p_code;
$$;
