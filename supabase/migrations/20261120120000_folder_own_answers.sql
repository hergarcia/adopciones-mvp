-- La respuesta a la pregunta propia en la carpeta de solicitudes de un animal (historia #298): el
-- encabezado trae la pregunta de hoy y cada solicitud que espera respuesta, la pregunta que contestó
-- con su respuesta. Las aceptadas y las cerradas no la traen: ahí ya se eligió, y entre dos opciones
-- razonables va la que muestra menos (Ley 18.331), aunque quien publicó la lea al abrirla.

drop function public.inbox_pet(uuid);

-- La de #206 con la pregunta que hoy contesta quien solicita: la de la camada si es una cría.
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
  litter_name text,
  own_question text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.code, p.name, p.sex,
         private.pet_state(p.status, p.expires_at, p.taken_down_at),
         ph.id, ph.owner_id, ph.width, ph.height, ph.thumbhash,
         l.code, l.name,
         private.pet_own_question(p)
    from public.pets p
    left join public.litters l on l.id = p.litter_id
    left join lateral private.pet_cover(p) ph on true
   where p.id = p_pet
     and p.owner_id = (select auth.uid())
     and p.taken_down_at is null;
$$;

drop function public.pet_applications(uuid);

create function public.pet_applications(p_pet uuid)
returns table (
  id uuid,
  status text,
  publisher_close text,
  sent_at timestamptz,
  changed_at timestamptz,
  is_new boolean,
  waiting_question boolean,
  applicant_public_id text,
  applicant_name text,
  applicant_has_photo boolean,
  applicant_department text,
  applicant_locality text,
  applicant_level smallint,
  housing_type text,
  outdoor_space text,
  hours_alone text,
  identity_asked boolean,
  own_question text,
  own_answer text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.status, private.publisher_close(a), a.sent_at, a.changed_at,
         a.status = 'sent' and r.opened_at is null,
         exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         ),
         pr.public_id, pr.display_name, pr.avatar_path is not null, pr.department, pr.locality,
         private.person_level(a.applicant_id),
         a.answers ->> 'housing_type',
         a.answers ->> 'outdoor_space',
         a.answers ->> 'hours_alone',
         a.status = 'sent' and k.application_id is not null and k.resolved_at is null,
         case when a.status = 'sent' then a.own_question end,
         case when a.status = 'sent' then a.own_answer end
    from public.applications a
    join public.pets p on p.id = a.pet_id
    left join public.application_reviews r on r.application_id = a.id
    left join public.application_identity_asks k on k.application_id = a.id
    left join public.profiles pr on pr.id = a.applicant_id
   where a.pet_id = p_pet
     and p.owner_id = (select auth.uid())
     and p.taken_down_at is null;
$$;

revoke all on function public.inbox_pet(uuid) from public, anon, authenticated;
revoke all on function public.pet_applications(uuid) from public, anon, authenticated;

grant execute on function public.inbox_pet(uuid) to authenticated;
grant execute on function public.pet_applications(uuid) to authenticated;
