-- Administrar (historia #73): lo que espera a quien administra, la ficha de una persona, la búsqueda
-- por nombre y el resumen de la mañana. Ningún dato nuevo de las personas: una tabla con el día en
-- que se mandó cada resumen, y funciones que leen lo que #11, #13, #59 y #71 ya guardan. Ninguna
-- policy de tabla cambia (research R1): quien administra lee por estas funciones, que preguntan
-- `private.is_admin()` adentro y no devuelven nada a cualquier otra sesión.

-- ---------------------------------------------------------------------------------------------
-- El envío del resumen
-- ---------------------------------------------------------------------------------------------

create table public.admin_digest_sends (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

comment on table public.admin_digest_sends is
  'Que a una persona que administra ya se le reclamó el resumen de un día de Uruguay (research R8): '
  'la segunda corrida del día no la vuelve a reclamar. No guarda nada de las colas; se purga a los '
  '7 días.';

create index admin_digest_sends_day_idx on public.admin_digest_sends (day);

alter table public.admin_digest_sends enable row level security;
revoke all on public.admin_digest_sends from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Lo que espera
-- ---------------------------------------------------------------------------------------------

-- Las mayúsculas con tilde se pliegan antes del `lower`, que en una base con `lc_ctype` C solo baja
-- las letras ASCII.
create or replace function private.fold_name(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(
    regexp_replace(
      lower(
        translate(
          p_text,
          'ÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛáéíóúüñàèìòùâêîôû',
          'AEIOUUNAEIOUAEIOUaeiouunaeiouaeiou'
        )
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

-- La única definición de «pendiente» (research R2), la misma que cada lista: Administrar, el menú y
-- el resumen la leen de acá.
create or replace function private.admin_queue_rows(p_admin uuid)
returns table (queue text, since timestamptz, is_own boolean, pet_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select 'identity', r.sent_at, r.user_id = p_admin, null::text
    from public.identity_requests r
   where r.expires_at > now()
  union all
  select 'pets', v.pending_since, p.owner_id = p_admin, p.name
    from public.pet_reviews v
    join public.pets p on p.id = v.pet_id
   where v.pending_since is not null
     and p.taken_down_at is null
     and not private.is_suspended(p.owner_id)
  union all
  -- La reportada sin perfil no está en Reportes (`report_queue` la une con `profiles`).
  select 'reports', r.created_at, r.reported_id = p_admin, null::text
    from public.reports r
    join public.profiles t on t.id = r.reported_id
   where r.resolved_at is null;
$$;

-- Una cola por llamada: si una falla, Administrar dice solo esa (FR-016). De lo propio sale solo
-- desde cuándo y, de una publicación, el nombre del animal (FR-013).
create or replace function public.admin_queue_count(p_queue text)
returns table (others integer, oldest timestamptz, own jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_queue is null or p_queue not in ('identity', 'pets', 'reports') then
    raise exception 'admin_queue_count: cola desconocida %', p_queue using errcode = '22023';
  end if;
  if not private.is_admin() then
    return;
  end if;

  return query
    select (count(*) filter (where not q.is_own))::integer,
           min(q.since) filter (where not q.is_own),
           coalesce(
             jsonb_agg(
               jsonb_build_object('since', q.since, 'pet_name', q.pet_name) order by q.since
             ) filter (where q.is_own),
             '[]'::jsonb
           )
      from private.admin_queue_rows((select auth.uid())) q
     where q.queue = p_queue;
end;
$$;

-- El número del menú en cada pantalla con sesión: nulo para quien no administra, que corta acá.
create or replace function public.admin_pending_total()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when private.is_admin() then (
             select count(*)::integer
               from private.admin_queue_rows((select auth.uid())) q
              where not q.is_own
           )
         end;
$$;

-- Lo llegado hoy y los 6 días anteriores de Uruguay (FR-014).
create or replace function public.admin_recent_counts()
returns table (feedback integer, survey_answers integer)
language sql
stable
security definer
set search_path = ''
as $$
  select (select count(*)::integer
            from public.feedback f
           where f.sent_on >= public.uruguay_today() - 6),
         (select count(*)::integer
            from public.survey_answers a
           where a.answered_on >= public.uruguay_today() - 6)
   where private.is_admin();
$$;

-- ---------------------------------------------------------------------------------------------
-- La ficha de una persona
-- ---------------------------------------------------------------------------------------------

-- Un documento por llamada (research R4), con exactamente lo que FR-031 a FR-037 dejan ver: nada
-- del teléfono, el correo, las imágenes, las solicitudes, los bloqueos ni las opiniones, ni quién
-- reportó o cerró un reporte. La propia ficha no trae los reportes sobre quien mira, solo cuántos
-- sin resolver esperan a otra persona (#13 no se los muestra a nadie reportado).
create or replace function public.admin_person_record(p_public_id text)
returns table (person jsonb, identity jsonb, reports jsonb, suspensions jsonb, pets jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_self boolean;
  -- La ventana de 30 días de #11, aunque la purga de los viejos no haya corrido.
  v_window date := public.uruguay_today() - 30;
begin
  if not private.is_admin() then
    return;
  end if;
  select pr.id into v_user from public.profiles pr where pr.public_id = p_public_id;
  if v_user is null then
    return;
  end if;
  v_self := v_user = (select auth.uid());

  return query
    select
      jsonb_build_object(
        'public_id', pr.public_id,
        'display_name', pr.display_name,
        'avatar_path', pr.avatar_path,
        'department', pr.department,
        'locality', pr.locality,
        'created_at', pr.created_at,
        'level', case
                   when public.identity_level_one(pr.id, private.pending_ttl())
                     then private.publisher_level(pr.id)
                   else 0::smallint
                 end,
        'is_self', v_self,
        'suspension', (
          select jsonb_build_object(
                   'id', s.id,
                   'reason', s.reason,
                   'suspended_at', s.suspended_at,
                   'suspended_by_name', a.display_name
                 )
            from public.account_suspensions s
            left join public.profiles a on a.id = s.suspended_by
           where s.user_id = pr.id
             and s.lifted_at is null
        )
      ),
      jsonb_build_object(
        'verified_on', (
          select v.verified_on from public.identity_verifications v where v.user_id = pr.id
        ),
        'open', (
          select jsonb_build_object('id', r.id, 'sent_at', r.sent_at, 'is_own', v_self)
            from public.identity_requests r
           where r.user_id = pr.id
             and r.expires_at > now()
        ),
        'rejections', coalesce(
          (select jsonb_agg(
                    jsonb_build_object('rejected_on', j.rejected_on, 'reason', j.reason)
                    order by j.rejected_on desc, j.id desc
                  )
             from public.identity_rejections j
            where j.user_id = pr.id
              and j.rejected_on > v_window),
          '[]'::jsonb
        ),
        'expired_on', (
          select e.expired_on
            from public.identity_expirations e
           where e.user_id = pr.id
             and e.expired_on > v_window
        )
      ),
      case
        when v_self then jsonb_build_object(
          'own_open', (
            select count(*)::integer
              from public.reports r
             where r.reported_id = pr.id
               and r.resolved_at is null
          ),
          'items', '[]'::jsonb
        )
        else jsonb_build_object(
          'own_open', 0,
          'items', coalesce(
            (select jsonb_agg(
                      jsonb_build_object(
                        'reason', x.reason,
                        'details', x.details,
                        'created_at', x.created_at,
                        'resolved_at', x.resolved_at,
                        'resolution', x.resolution
                      )
                      order by x.created_at desc, x.id desc
                    )
               from (select r.id, r.reason, r.details, r.created_at, r.resolved_at, r.resolution
                       from public.reports r
                      where r.reported_id = pr.id
                      order by r.created_at desc, r.id desc
                      limit 500) x),
            '[]'::jsonb
          )
        )
      end,
      coalesce(
        (select jsonb_agg(
                  jsonb_build_object(
                    'reason', x.reason,
                    'suspended_at', x.suspended_at,
                    'suspended_by_name', x.suspended_by_name,
                    'lifted_at', x.lifted_at,
                    'lifted_by_name', x.lifted_by_name
                  )
                  order by x.suspended_at desc, x.id desc
                )
           from (select s.id, s.reason, s.suspended_at, s.lifted_at,
                        a.display_name as suspended_by_name, b.display_name as lifted_by_name
                   from public.account_suspensions s
                   left join public.profiles a on a.id = s.suspended_by
                   left join public.profiles b on b.id = s.lifted_by
                  where s.user_id = pr.id
                  order by s.suspended_at desc, s.id desc
                  limit 500) x),
        '[]'::jsonb
      ),
      coalesce(
        (select jsonb_agg(
                  jsonb_build_object(
                    'code', x.code,
                    'name', x.name,
                    'state', x.state,
                    'pending_review', x.pending_review,
                    'takedown_reason', x.takedown_reason,
                    'published_at', x.published_at
                  )
                  order by x.published_at desc, x.id desc
                )
           from (select p.id, p.code, p.name, p.takedown_reason, p.published_at,
                        private.pet_state(p.status, p.expires_at, p.taken_down_at) as state,
                        -- La misma regla que Publicaciones por revisar: lo que no está ahí no se
                        -- dice «por revisar» acá.
                        coalesce(
                          v.pending_since is not null
                            and p.taken_down_at is null
                            and not private.is_suspended(p.owner_id),
                          false
                        ) as pending_review
                   from public.pets p
                   left join public.pet_reviews v on v.pet_id = p.id
                  where p.owner_id = pr.id
                  order by p.published_at desc, p.id desc
                  limit 500) x),
        '[]'::jsonb
      )
      from public.profiles pr
     where pr.id = v_user;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Buscar por nombre
-- ---------------------------------------------------------------------------------------------

-- Solo el nombre para mostrar (FR-055), plegado en los dos lados; `strpos` en vez de `like` para no
-- escapar lo que la persona escribe (research R6). Una fila de más dice que hay más.
create or replace function public.admin_search_people(p_query text, p_limit integer)
returns table (
  public_id text,
  display_name text,
  avatar_path text,
  department text,
  locality text,
  is_suspended boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_query text := coalesce(private.fold_name(p_query), '');
begin
  if not private.is_admin() or char_length(replace(v_query, ' ', '')) < 3 then
    return;
  end if;

  return query
    select pr.public_id, pr.display_name, pr.avatar_path, pr.department, pr.locality,
           private.is_suspended(pr.id)
      from public.profiles pr
     where strpos(private.fold_name(pr.display_name), v_query) > 0
     order by strpos(private.fold_name(pr.display_name), v_query) = 1 desc,
              private.fold_name(pr.display_name),
              pr.created_at,
              pr.id
     limit least(greatest(coalesce(p_limit, 20), 1), 50) + 1;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- El resumen de la mañana
-- ---------------------------------------------------------------------------------------------

-- Reclama, en una sola sentencia, a cada persona que administra, no está suspendida, tiene algo que
-- puede resolver y todavía no recibió el de hoy (research R8). Si algo falla no queda nadie
-- reclamado; si el correo después no sale, no se reintenta ese día (FR-063).
create or replace function public.claim_admin_digests()
returns table (
  user_id uuid,
  identity_count integer,
  identity_oldest timestamptz,
  pets_count integer,
  pets_oldest timestamptz,
  reports_count integer,
  reports_oldest timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_today date := public.uruguay_today();
begin
  delete from public.admin_digest_sends s where s.day < v_today - 7;

  return query
    with waiting as (
      select a.user_id as admin_id,
             (count(*) filter (where q.queue = 'identity'))::integer as identity_count,
             min(q.since) filter (where q.queue = 'identity') as identity_oldest,
             (count(*) filter (where q.queue = 'pets'))::integer as pets_count,
             min(q.since) filter (where q.queue = 'pets') as pets_oldest,
             (count(*) filter (where q.queue = 'reports'))::integer as reports_count,
             min(q.since) filter (where q.queue = 'reports') as reports_oldest
        from public.admins a
       cross join lateral private.admin_queue_rows(a.user_id) q
       where not q.is_own
         and not private.is_suspended(a.user_id)
         and not exists (
           select 1
             from public.admin_digest_sends s
            where s.user_id = a.user_id
              and s.day = v_today
         )
       group by a.user_id
    ),
    claimed as (
      insert into public.admin_digest_sends (user_id, day)
      select w.admin_id, v_today from waiting w
      on conflict do nothing
      returning admin_digest_sends.user_id as admin_id
    )
    select w.admin_id, w.identity_count, w.identity_oldest, w.pets_count, w.pets_oldest,
           w.reports_count, w.reports_oldest
      from waiting w
      join claimed c on c.admin_id = w.admin_id;
end;
$$;

-- Como `pet_lifecycle_tick`: le pide a la aplicación que mande los resúmenes. Sin la URL o el
-- secreto en Vault no llama a nada.
create or replace function public.admin_digest_tick()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select s.decrypted_secret into v_url from vault.decrypted_secrets s where s.name = 'app_url';
  select s.decrypted_secret into v_secret from vault.decrypted_secrets s where s.name = 'cron_secret';
  if v_url is null or v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := v_url || '/api/cron/resumen',
    headers := jsonb_build_object('x-cron-secret', v_secret, 'content-type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Publicaciones por revisar, con el id público de quien publica (research R5)
-- ---------------------------------------------------------------------------------------------

drop function public.pet_review_queue(integer);

create function public.pet_review_queue(p_limit integer)
returns table (
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
  state text,
  pending_kind text,
  pending_since timestamptz,
  is_own boolean,
  owner_folder uuid,
  photos jsonb,
  publisher_name text,
  publisher_avatar_path text,
  publisher_is_rescuer boolean,
  publisher_level smallint,
  publisher_public_id text,
  total bigint,
  others bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    return;
  end if;

  return query
    select p.id, p.code, p.name, p.species, p.sex, p.age_value, p.age_unit, p.age_as_of, p.size,
           p.is_neutered, p.vaccines, p.has_chip, p.good_with_kids, p.good_with_dogs,
           p.good_with_cats, p.description, p.department, p.locality, p.is_urgent,
           private.pet_state(p.status, p.expires_at, p.taken_down_at),
           r.pending_kind, r.pending_since,
           p.owner_id = (select auth.uid()),
           p.owner_id,
           coalesce(
             (select jsonb_agg(
                       jsonb_build_object(
                         'id', ph.id, 'width', ph.width, 'height', ph.height,
                         'thumbhash', ph.thumbhash
                       ) order by ph.position
                     )
                from public.pet_photos ph
               where ph.pet_id = p.id),
             '[]'::jsonb
           ),
           pr.display_name, pr.avatar_path, pr.is_rescuer,
           -- Sin nivel 1 no hay escalera: la pantalla lo dice en palabras.
           case when private.pet_is_listed(p.owner_id) then private.publisher_level(p.owner_id) end,
           pr.public_id,
           count(*) over (),
           count(*) filter (where p.owner_id <> (select auth.uid())) over ()
      from public.pet_reviews r
      join public.pets p on p.id = r.pet_id
      left join public.profiles pr on pr.id = p.owner_id
     where r.pending_since is not null
       and p.taken_down_at is null
       and not private.is_suspended(p.owner_id)
     order by r.pending_since, p.id
     limit least(greatest(coalesce(p_limit, 20), 1), 100);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- La foto de perfil en la ficha y en la búsqueda (research R10)
-- ---------------------------------------------------------------------------------------------

create policy avatars_select_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (select private.is_admin()));

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.fold_name(text) from public, anon, authenticated;
revoke all on function private.admin_queue_rows(uuid) from public, anon, authenticated;
revoke all on function public.admin_queue_count(text) from public, anon, authenticated;
revoke all on function public.admin_pending_total() from public, anon, authenticated;
revoke all on function public.admin_recent_counts() from public, anon, authenticated;
revoke all on function public.admin_person_record(text) from public, anon, authenticated;
revoke all on function public.admin_search_people(text, integer) from public, anon, authenticated;
revoke all on function public.claim_admin_digests() from public, anon, authenticated;
revoke all on function public.admin_digest_tick() from public, anon, authenticated;
revoke all on function public.pet_review_queue(integer) from public, anon, authenticated;

grant execute on function public.admin_queue_count(text) to authenticated;
grant execute on function public.admin_pending_total() to authenticated;
grant execute on function public.admin_recent_counts() to authenticated;
grant execute on function public.admin_person_record(text) to authenticated;
grant execute on function public.admin_search_people(text, integer) to authenticated;
grant execute on function public.claim_admin_digests() to service_role;
grant execute on function public.admin_digest_tick() to service_role;
grant execute on function public.pet_review_queue(integer) to authenticated;

-- 11:00 UTC son las 8 de Uruguay, que no tiene horario de verano desde 2015.
select cron.schedule('admin-digest', '0 11 * * *', 'select public.admin_digest_tick()');
