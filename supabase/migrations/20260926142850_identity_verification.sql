-- La verificación de identidad con revisión manual (historia #11). Un pedido en revisión vive en
-- `identity_requests` con sus dos fotos al lado; cerrarse es borrarse, y lo que queda de cada cierre
-- está en su propia tabla con exactamente lo que FR-031 enumera: la retención es estructural. Toda
-- escritura pasa por las funciones de abajo, con el candado de la cuenta y permisos de servicio;
-- toda lectura, por RLS con la sesión de quien mira. Los números de las reglas llegan como
-- parámetros desde `lib/verification/rules.ts`, salvo en las dos tareas programadas, que la base
-- corre sola y por eso los escriben en su comando.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Fuera de los esquemas que publica la API: nadie puede llamar a sus funciones por HTTP.
create schema if not exists private;

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admins is
  'Quienes administran (FR-013a). Una fila y no un claim del token: un claim tarda hasta una hora '
  'en caducar, y quien deja de administrar pierde el acceso en ese momento (FR-022b). La escribe el '
  'equipo desde la consola; el sitio no tiene forma de hacerlo.';

alter table public.admins enable row level security;

create policy admins_select_own on public.admins
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- `security definer` porque las policies de abajo lo evalúan con la sesión de quien mira, que solo
-- ve su propia fila de `admins`: alcanza, pero así la pregunta no depende de esa policy.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create table public.identity_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  origin text not null,

  constraint identity_requests_origin_valid check (origin in ('profile'))
);

comment on table public.identity_requests is
  'Solo los pedidos en revisión. Un pedido que se resuelve, se retira o vence se borra, y con él '
  'sus imágenes (plan §1). `unique` en la cuenta alcanza para el pedido único (FR-009) porque los '
  'cerrados no quedan acá.';

comment on column public.identity_requests.expires_at is
  'sent_at + 7 días. Las policies y las lecturas comparan contra now(): un pedido vencido no se ve '
  'en la cola ni se resuelve aunque la tarea todavía no lo haya borrado (FR-028).';

comment on column public.identity_requests.origin is
  'Desde dónde llegó la persona (FR-035), para los eventos del cierre. La historia de la '
  'publicación que exige nivel 2 suma su valor al check.';

create index identity_requests_expires_at_idx on public.identity_requests (expires_at);
create index identity_requests_sent_at_idx on public.identity_requests (sent_at);

alter table public.identity_requests enable row level security;

-- Una sola policy de lectura, con las dos condiciones: la dueña, sin filtro de tiempo (la lectura
-- decide si venció), y quien administra, solo mientras está vigente. Incluye el propio: la cola lo
-- muestra marcado, sin imágenes y sin acciones (FR-020).
create policy identity_requests_select on public.identity_requests
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    or ((select private.is_admin()) and expires_at > now())
  );

revoke all on public.identity_requests from anon, authenticated;
grant select on public.identity_requests to authenticated;

create table public.identity_request_images (
  request_id uuid not null references public.identity_requests (id) on delete cascade,
  kind text not null,
  data bytea not null,

  primary key (request_id, kind),
  constraint identity_request_images_kind_valid check (kind in ('front', 'selfie')),
  constraint identity_request_images_size check (octet_length(data) <= 460800)
);

comment on table public.identity_request_images is
  'Las dos fotos de un pedido, como WebP o JPEG ya procesado en el navegador (sin metadatos, FR-008a). En '
  'la base y no en Storage: borrarlas es parte de la misma transacción que cierra el pedido, y el '
  'vencimiento las borra desde SQL sin depender de la aplicación (FR-012, FR-018, FR-028).';

comment on column public.identity_request_images.data is
  'Tope de 450 KB, el mismo del schema del servidor: una red por si algo llegara sin procesar.';

alter table public.identity_request_images enable row level security;

-- La única policy. La dueña no tiene ninguna: no vuelve a ver sus imágenes (FR-011).
create policy identity_request_images_select_reviewer on public.identity_request_images
  for select to authenticated
  using (
    (select private.is_admin())
    and exists (
      select 1
        from public.identity_requests r
       where r.id = request_id
         and r.expires_at > now()
         and r.user_id <> (select auth.uid())
    )
  );

revoke all on public.identity_request_images from anon, authenticated;
grant select on public.identity_request_images to authenticated;

create table public.identity_verifications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  verified_on date not null
);

comment on table public.identity_verifications is
  'La identidad verificada de una cuenta y el día de Uruguay en que se aprobó (FR-031). Es de la '
  'cuenta y no del número: cambiar o perder el teléfono no la toca (FR-023).';

alter table public.identity_verifications enable row level security;

create policy identity_verifications_select_own on public.identity_verifications
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.identity_verifications from anon, authenticated;
grant select on public.identity_verifications to authenticated;

create table public.identity_rejections (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  rejected_on date not null,
  reason text not null,

  constraint identity_rejections_reason_valid check (
    reason in ('unreadable', 'mismatch', 'expired_document', 'suspected_fraud')
  )
);

comment on table public.identity_rejections is
  'El día y el motivo de cada rechazo, 30 días (FR-031). Cuentan para el tope; los retiros y los '
  'vencimientos no están acá, así que no pueden contar (FR-027). Las lecturas igual filtran por la '
  'ventana, por si la tarea que los borra no corrió.';

create index identity_rejections_user_idx on public.identity_rejections (user_id, rejected_on desc);

alter table public.identity_rejections enable row level security;

-- La dueña ve los suyos; quien administra, solo los de una cuenta con un pedido en revisión: es lo
-- que el pedido muestra (FR-014).
create policy identity_rejections_select on public.identity_rejections
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    or (
      (select private.is_admin())
      and exists (
        select 1
          from public.identity_requests r
         where r.user_id = identity_rejections.user_id
           and r.expires_at > now()
      )
    )
  );

revoke all on public.identity_rejections from anon, authenticated;
grant select on public.identity_rejections to authenticated;

create table public.identity_expirations (
  user_id uuid primary key references auth.users (id) on delete cascade,
  expired_on date not null,
  notice_pending boolean not null default true,
  notice_origin text,

  constraint identity_expirations_notice_origin check ((notice_origin is null) or notice_pending)
);

comment on table public.identity_expirations is
  'El último vencimiento de la cuenta y el día, para que la persona vea «vencido». Se borra al '
  'enviar un pedido nuevo o a los 30 días (FR-031).';

comment on column public.identity_expirations.notice_pending is
  'El correo de vencimiento todavía no se intentó (plan §10). Pasado un día se apaga sin mandarlo: '
  'un correo que nunca pudo salir no vale una fila más.';

comment on column public.identity_expirations.notice_origin is
  'El origen del pedido vencido, para el evento de vencimiento (FR-035). Vive lo que vive el aviso '
  'pendiente: se borra al procesarlo.';

alter table public.identity_expirations enable row level security;

create policy identity_expirations_select_own on public.identity_expirations
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.identity_expirations from anon, authenticated;
grant select on public.identity_expirations to authenticated;

create table public.identity_resolutions (
  request_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  resolved_by uuid references auth.users (id) on delete set null
);

comment on table public.identity_resolutions is
  'Quién resolvió cada pedido, hasta que se borra la cuenta de la persona (FR-031). Sin día ni '
  'resultado, a propósito: ya están en identity_verifications o, 30 días, en identity_rejections. '
  'La persona no la lee (FR-032).';

comment on column public.identity_resolutions.request_id is
  'El id del pedido ya borrado. No nombra a nadie por sí solo; dice «ya fue resuelto» a quien lo '
  'tenía abierto (FR-021).';

comment on column public.identity_resolutions.resolved_by is
  'Nulo es «una cuenta borrada» (FR-034a).';

create index identity_resolutions_user_idx on public.identity_resolutions (user_id);
create index identity_resolutions_resolved_by_idx on public.identity_resolutions (resolved_by);

alter table public.identity_resolutions enable row level security;

create policy identity_resolutions_select_admin on public.identity_resolutions
  for select to authenticated
  using ((select private.is_admin()));

revoke all on public.identity_resolutions from anon, authenticated;
grant select on public.identity_resolutions to authenticated;

-- Quien administra lee el perfil de una cuenta solo mientras tiene un pedido en revisión (FR-014).
-- El correo y el teléfono no están en `profiles`, y ninguna policy los abre. Reemplaza a la policy
-- de la dueña con las dos condiciones en una: dos policies permisivas se evalúan las dos en cada
-- lectura.
drop policy profiles_select_own on public.profiles;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    (select auth.uid()) = id
    or (
      (select private.is_admin())
      and exists (
        select 1
          from public.identity_requests r
         where r.user_id = profiles.id
           and r.expires_at > now()
      )
    )
  );

-- El candado de una cuenta. Enviar, retirar y resolver un pedido de una misma cuenta se hacen de a
-- uno: sin esto, cinco envíos en paralelo pasan el tope, y un retiro y una resolución valen los dos.
create or replace function public.lock_identity_account(p_user_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended('identity-user:' || p_user_id::text, 0));
$$;

create or replace function public.uruguay_today()
returns date
language sql
stable
security invoker
set search_path = ''
as $$
  select (now() at time zone 'America/Montevideo')::date;
$$;

-- Nivel 1, igual que `phoneStatus`: un número verificado y ningún cambio a medias vigente.
create or replace function public.identity_level_one(p_user_id uuid, p_pending_ttl interval)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
      from public.phones p
     where p.user_id = p_user_id
       and p.verified_number is not null
       and (p.pending_number is null or p.pending_since <= now() - p_pending_ttl)
  );
$$;

-- Cuándo vuelve a poder pedir una cuenta en el tope: el día en que el más viejo de los rechazos que
-- la dejan en el tope cumple la ventana (FR-027). Nulo si no está en el tope.
create or replace function public.identity_retry_on(
  p_user_id uuid,
  p_window_days integer,
  p_cap integer
)
returns date
language sql
stable
security invoker
set search_path = ''
as $$
  select j.rejected_on + p_window_days
    from public.identity_rejections j
   where j.user_id = p_user_id
     and j.rejected_on > public.uruguay_today() - p_window_days
     and (
       select count(*)
         from public.identity_rejections c
        where c.user_id = p_user_id
          and c.rejected_on > public.uruguay_today() - p_window_days
     ) >= p_cap
   order by j.rejected_on desc, j.id desc
  offset p_cap - 1
   limit 1;
$$;

-- Todo o nada: el pedido con sus dos imágenes, o ninguna fila (FR-008).
create or replace function public.submit_identity_request(
  p_user_id uuid,
  p_origin text,
  p_front text,
  p_selfie text,
  p_ttl interval,
  p_window_days integer,
  p_cap integer,
  p_pending_ttl interval
)
returns table (decision text, request_id uuid, retry_on date)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_open record;
  v_id uuid;
begin
  perform public.lock_identity_account(p_user_id);

  if exists (select 1 from public.identity_verifications v where v.user_id = p_user_id) then
    decision := 'already_verified';
    return next;
    return;
  end if;

  select r.id, r.expires_at into v_open
    from public.identity_requests r
   where r.user_id = p_user_id;
  if v_open.id is not null and v_open.expires_at > now() then
    decision := 'already_open';
    return next;
    return;
  end if;

  if not public.identity_level_one(p_user_id, p_pending_ttl) then
    decision := 'no_phone';
    return next;
    return;
  end if;

  retry_on := public.identity_retry_on(p_user_id, p_window_days, p_cap);
  if retry_on is not null then
    decision := 'capped';
    return next;
    return;
  end if;

  -- Uno vencido que la tarea todavía no borró: la persona ya lo ve vencido y pide otro, que lo
  -- reemplaza con sus imágenes.
  if v_open.id is not null then
    delete from public.identity_requests r where r.id = v_open.id;
  end if;

  insert into public.identity_requests (user_id, expires_at, origin)
  values (p_user_id, now() + p_ttl, p_origin)
  returning id into v_id;

  insert into public.identity_request_images (request_id, kind, data)
  values
    (v_id, 'front', decode(p_front, 'base64')),
    (v_id, 'selfie', decode(p_selfie, 'base64'));

  delete from public.identity_expirations e where e.user_id = p_user_id;

  decision := 'sent';
  request_id := v_id;
  return next;
end;
$$;

-- Retirar borra el pedido, y las imágenes caen por la cascada en la misma transacción (FR-012). De
-- un retiro no queda nada (FR-012a). Uno vencido no se retira: lo cierra la tarea (FR-012b).
create or replace function public.withdraw_identity_request(p_user_id uuid)
returns table (decision text, request_sent_at timestamptz, request_origin text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_open record;
begin
  perform public.lock_identity_account(p_user_id);

  select r.id, r.sent_at, r.origin, r.expires_at into v_open
    from public.identity_requests r
   where r.user_id = p_user_id
     for update;

  if v_open.id is null then
    decision := 'not_open';
  elsif v_open.expires_at <= now() then
    decision := 'expired';
  else
    delete from public.identity_requests r where r.id = v_open.id;
    decision := 'withdrawn';
    request_sent_at := v_open.sent_at;
    request_origin := v_open.origin;
  end if;
  return next;
end;
$$;

-- Resolver en un solo paso (FR-018): borra el pedido y sus imágenes, deja la verificación o el
-- rechazo, y quién lo resolvió. Toma el candado de la cuenta dueña, el mismo del retiro, así que
-- un retiro y una resolución en paralelo valen de a uno; la segunda resolución no encuentra el
-- pedido (FR-022). Quién administra se lee acá adentro y no en la sesión (FR-022b).
create or replace function public.resolve_identity_request(
  p_request_id uuid,
  p_admin uuid,
  p_outcome text,
  p_window_days integer,
  p_cap integer,
  p_pending_ttl interval,
  p_reason text default null
)
returns table (
  decision text,
  owner_id uuid,
  request_sent_at timestamptz,
  request_origin text,
  resolved_on date,
  rejections_in_window integer,
  retry_on date,
  level_one boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid;
  v_open record;
  v_today date := public.uruguay_today();
begin
  if p_outcome not in ('approve', 'reject') or (p_outcome = 'reject') <> (p_reason is not null) then
    raise exception 'resolve_identity_request: resultado % con motivo %', p_outcome, p_reason;
  end if;

  if not exists (select 1 from public.admins a where a.user_id = p_admin) then
    decision := 'not_admin';
    return next;
    return;
  end if;

  select r.user_id into v_owner from public.identity_requests r where r.id = p_request_id;
  if v_owner is null then
    decision := 'gone';
    return next;
    return;
  end if;

  perform public.lock_identity_account(v_owner);

  select r.id, r.user_id, r.sent_at, r.origin, r.expires_at into v_open
    from public.identity_requests r
   where r.id = p_request_id
     for update;

  if v_open.id is null then
    decision := 'gone';
    return next;
    return;
  end if;
  if v_open.user_id = p_admin then
    decision := 'own_request';
    return next;
    return;
  end if;
  if v_open.expires_at <= now() then
    decision := 'expired';
    return next;
    return;
  end if;

  delete from public.identity_requests r where r.id = p_request_id;

  if p_outcome = 'approve' then
    insert into public.identity_verifications (user_id, verified_on) values (v_owner, v_today);
    decision := 'approved';
  else
    insert into public.identity_rejections (user_id, rejected_on, reason)
    values (v_owner, v_today, p_reason);
    decision := 'rejected';
  end if;

  insert into public.identity_resolutions (request_id, user_id, resolved_by)
  values (p_request_id, v_owner, p_admin);

  owner_id := v_owner;
  request_sent_at := v_open.sent_at;
  request_origin := v_open.origin;
  resolved_on := v_today;
  select count(*)::integer into rejections_in_window
    from public.identity_rejections j
   where j.user_id = v_owner
     and j.rejected_on > v_today - p_window_days;
  retry_on := public.identity_retry_on(v_owner, p_window_days, p_cap);
  level_one := public.identity_level_one(v_owner, p_pending_ttl);
  return next;
end;
$$;

-- La tarea de cada 5 minutos. Vence los pedidos de más de 7 días (las imágenes caen por la cascada,
-- FR-028), anota el aviso pendiente, y borra lo que ya cumplió su plazo (FR-031). Un pedido que se
-- está resolviendo o retirando tiene la fila tomada: el borrado espera y, si el otro ganó, no la
-- encuentra.
create or replace function public.expire_identity_requests(
  p_window_days integer,
  p_notice_days integer
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_today date := public.uruguay_today();
  v_expired integer;
begin
  with expired as (
    delete from public.identity_requests r
     where r.expires_at <= now()
    returning r.user_id, r.expires_at, r.origin
  )
  insert into public.identity_expirations as e (user_id, expired_on, notice_pending, notice_origin)
  select x.user_id, (x.expires_at at time zone 'America/Montevideo')::date, true, x.origin
    from expired x
  on conflict (user_id) do update
    set expired_on = excluded.expired_on,
        notice_pending = true,
        notice_origin = excluded.notice_origin;
  get diagnostics v_expired = row_count;

  delete from public.identity_rejections j where j.rejected_on <= v_today - p_window_days;
  delete from public.identity_expirations e where e.expired_on <= v_today - p_window_days;

  -- Solo el día queda guardado, así que «más de 24 horas» es «de antes de ayer».
  update public.identity_expirations e
     set notice_pending = false, notice_origin = null
   where e.notice_pending
     and e.expired_on < v_today - p_notice_days;

  return v_expired;
end;
$$;

-- Si hay avisos pendientes, le pide a la aplicación que mande los correos. La URL y el secreto
-- viven en Vault; sin ellos no llama a nada. La llamada es asíncrona: no espera ni toca ninguna
-- tabla nuestra, así que si la aplicación está apagada el aviso espera a la vuelta siguiente.
create or replace function public.identity_expiry_mail_tick()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists (select 1 from public.identity_expirations e where e.notice_pending) then
    return;
  end if;

  select s.decrypted_secret into v_url from vault.decrypted_secrets s where s.name = 'app_url';
  select s.decrypted_secret into v_secret from vault.decrypted_secrets s where s.name = 'cron_secret';
  if v_url is null or v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := v_url || '/api/cron/identidad',
    headers := jsonb_build_object('x-cron-secret', v_secret, 'content-type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

-- Supabase concede `execute` a anon y authenticated sobre toda función nueva de public. Estas solo
-- las llama el servidor con permisos de servicio, después de comprobar la sesión, o la base sola.
revoke all on function public.lock_identity_account(uuid) from public, anon, authenticated;
revoke all on function public.uruguay_today() from public, anon, authenticated;
revoke all on function public.identity_level_one(uuid, interval) from public, anon, authenticated;
revoke all on function public.identity_retry_on(uuid, integer, integer)
  from public, anon, authenticated;
revoke all on function public.submit_identity_request(
  uuid, text, text, text, interval, integer, integer, interval
) from public, anon, authenticated;
revoke all on function public.withdraw_identity_request(uuid) from public, anon, authenticated;
revoke all on function public.resolve_identity_request(
  uuid, uuid, text, integer, integer, interval, text
) from public, anon, authenticated;
revoke all on function public.expire_identity_requests(integer, integer)
  from public, anon, authenticated;
revoke all on function public.identity_expiry_mail_tick() from public, anon, authenticated;

grant execute on function public.lock_identity_account(uuid) to service_role;
grant execute on function public.uruguay_today() to service_role;
grant execute on function public.identity_level_one(uuid, interval) to service_role;
grant execute on function public.identity_retry_on(uuid, integer, integer) to service_role;
grant execute on function public.submit_identity_request(
  uuid, text, text, text, interval, integer, integer, interval
) to service_role;
grant execute on function public.withdraw_identity_request(uuid) to service_role;
grant execute on function public.resolve_identity_request(
  uuid, uuid, text, integer, integer, interval, text
) to service_role;
grant execute on function public.expire_identity_requests(integer, integer) to service_role;
grant execute on function public.identity_expiry_mail_tick() to service_role;

-- La base corre sola el vencimiento: el borrado de las imágenes no depende de que la aplicación
-- esté levantada (FR-028). 30 es IDENTITY_REJECTION_WINDOW_DAYS y 1 el día de gracia del aviso,
-- escritos acá porque nadie de la aplicación está para pasarlos.
select cron.schedule(
  'identity-expire',
  '*/5 * * * *',
  'select public.expire_identity_requests(30, 1)'
);
select cron.schedule(
  'identity-expiry-mail',
  '*/5 * * * *',
  'select public.identity_expiry_mail_tick()'
);
