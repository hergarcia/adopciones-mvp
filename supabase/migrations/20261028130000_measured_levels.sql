-- Lo que la medición de la historia #236 lee de las personas: el nivel de la chapita de hoy y si
-- quien solicitó tiene una adopción con seguimiento. Ninguna tabla nueva; dos lecturas que solo
-- corre el servicio, porque devuelven el nivel de cualquiera por un id (research R1, R2).

-- El nivel de ahora de quien solicitó y de quien publicó, y si quien solicitó adoptó y respondió un
-- seguimiento: la misma cuenta que la cabecera de la solicitud, que da `0` a una suspendida. Una
-- cuenta borrada se lleva sus solicitudes, así que no hay fila; quien publicó y borró su cuenta queda
-- sin nivel, nunca con un 0 que parezca el de alguien sin teléfono.
create function public.application_measure(p_application uuid)
returns table (applicant_level smallint, applicant_follow_up boolean, publisher_level smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select private.person_level(a.applicant_id),
         (select c.adopted > 0 from private.follow_up_counts(a.applicant_id) c),
         case when a.publisher_id is not null then private.person_level(a.publisher_id) end
    from public.applications a
   where a.id = p_application;
$$;

-- El nivel de ahora de quien publicó el animal con ese código, o nulo si no existe. Una cría tiene su
-- código y su dueña, que es quien publicó la camada.
create function public.pet_publisher_level(p_code text)
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select private.person_level(p.owner_id)
    from public.pets p
   where p.code = p_code;
$$;

revoke all on function public.application_measure(uuid) from public, anon, authenticated;
revoke all on function public.pet_publisher_level(text) from public, anon, authenticated;
grant execute on function public.application_measure(uuid) to service_role;
grant execute on function public.pet_publisher_level(text) to service_role;
