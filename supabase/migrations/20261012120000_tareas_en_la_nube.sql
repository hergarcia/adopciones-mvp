-- Las tareas solas en la nube (historia #169, US5): las dos limpiezas diarias que hasta hoy corrían
-- solo cuando alguien usaba el sitio (KL-016, KL-53-1), la vuelta anotada de cada tarea y la
-- vigilancia que avisa la que se atrasó (research R6, R7). Nada de esto guarda datos de personas.

-- ---------------------------------------------------------------------------------------------
-- Las vueltas y los avisos ya dados
-- ---------------------------------------------------------------------------------------------

-- La última vuelta que terminó bien de cada tarea, con el nombre de su trabajo de `pg_cron` o de la
-- ruta que la anota (`lib/cron/tasks.ts`).
create table private.task_runs (
  task text primary key,
  last_ok_at timestamptz not null default now()
);

comment on table private.task_runs is
  'La última vuelta completa de cada tarea sola; la lee la vigilancia (FR-043).';

-- Un aviso por tarea y por día de Uruguay (FR-043).
create table private.task_alerts (
  task text not null,
  alerted_on date not null default public.uruguay_today(),

  primary key (task, alerted_on)
);

comment on table private.task_alerts is
  'Qué tarea atrasada ya se avisó hoy, para no avisarla en cada vuelta de la vigilancia.';

-- `pg_net` no espera la respuesta: el trabajo de `pg_cron` anota su vuelta apenas encola el pedido, y
-- la respuesta llega después a `net._http_response`, que guarda el id del pedido pero no a quién se
-- llamó. Con esto la vigilancia sabe de qué tarea es una respuesta que no fue 2xx (FR-043).
create table private.task_calls (
  request_id bigint primary key,
  task text not null,
  called_at timestamptz not null default now()
);

comment on table private.task_calls is
  'Qué tarea hizo cada pedido de pg_net a la aplicación; la vigilancia lee su respuesta.';

-- `private` no lo publica la API, pero tiene `usage` para anon y authenticated (lo usan otras
-- funciones). Sin permisos y con RLS sin políticas: si algún día se publicara, no se lee nada.
alter table private.task_runs enable row level security;
alter table private.task_alerts enable row level security;
alter table private.task_calls enable row level security;
revoke all on private.task_runs from public, anon, authenticated, service_role;
revoke all on private.task_alerts from public, anon, authenticated, service_role;
revoke all on private.task_calls from public, anon, authenticated, service_role;

-- La vigilancia cuenta desde que se aplicó la migración, no avisa de todo el día que se sube la base.
insert into private.task_runs (task)
values
  ('pet-lifecycle'),
  ('identity-expire'),
  ('identity-expiry-mail'),
  ('follow-ups'),
  ('admin-digest'),
  ('phone-records-purge'),
  ('daily-cleanup'),
  ('pet-renewal-links-purge'),
  ('withheld-numbers-purge'),
  ('cron-history-purge'),
  ('vigilancia-diaria');

-- ---------------------------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------------------------

-- La llaman los comandos de `pg_cron`, que corren como el dueño de la tabla.
create or replace function private.task_ran(p_task text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into private.task_runs (task, last_ok_at)
  values (p_task, now())
  on conflict (task) do update set last_ok_at = excluded.last_ok_at;
$$;

-- Lo mismo para las rutas de la aplicación que corren a diario.
create or replace function public.record_task_run(p_task text)
returns void
language sql
security definer
set search_path = ''
as $$
  select private.task_ran(p_task);
$$;

create or replace function public.list_task_runs()
returns table (task text, last_ok_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.task, r.last_ok_at from private.task_runs r;
$$;

-- true la primera vez del día de Uruguay; false si esa tarea ya se avisó hoy.
create or replace function public.claim_task_alert(p_task text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with claimed as (
    insert into private.task_alerts (task)
    values (p_task)
    on conflict do nothing
    returning 1
  )
  select exists (select 1 from claimed);
$$;

-- La llamada de una tarea a la aplicación. Sin la dirección o el secreto en Vault es una falla, no
-- una vuelta sin nada que hacer: el trabajo de `pg_cron` termina con error y no anota su vuelta. Un
-- minuto de espera y no los 5 segundos de `pg_net`: las rutas mandan los correos de a uno y
-- espaciados, y una vuelta con trabajo se cortaría antes de responder como si hubiera fallado.
create or replace function private.call_app(p_path text)
returns bigint
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
    raise exception 'Faltan app_url o cron_secret en Vault: no se llamó a %', p_path;
  end if;

  return net.http_post(
    url := v_url || p_path,
    headers := jsonb_build_object('x-cron-secret', v_secret, 'content-type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;

-- La de una tarea vigilada, que además anota de quién es el pedido.
create or replace function private.call_app_for(p_task text, p_path text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into private.task_calls (request_id, task) values (private.call_app(p_path), p_task);
$$;

-- Las tres que ya llamaban a la aplicación, iguales a las de su migración salvo la llamada. La de las
-- publicaciones es la de #69.
create or replace function public.pet_lifecycle_tick()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
       select 1
         from public.pets p
        where p.reminder_sent_at is null
          and p.taken_down_at is null
          and p.status in ('available', 'in_process')
          and p.expires_at > now()
          and p.expires_at <= now() + private.pet_reminder_lead()
     )
     and not exists (
       select 1
         from public.pets p
        where p.expiry_counted_at is null
          and p.taken_down_at is null
          and p.status in ('available', 'in_process')
          and p.expires_at <= now()
     )
     and not exists (
       select 1
         from public.application_notices n
        where n.created_at <= now() - interval '1 minute'
     )
     and not exists (select 1 from public.follow_ups f where f.measured_at is null)
     and not exists (select 1 from public.follow_up_photo_purges) then
    return;
  end if;

  perform private.call_app_for('pet-lifecycle', '/api/cron/publicaciones');
end;
$$;

create or replace function public.identity_expiry_mail_tick()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.identity_expirations e where e.notice_pending) then
    return;
  end if;

  perform private.call_app_for('identity-expiry-mail', '/api/cron/identidad');
end;
$$;

create or replace function public.admin_digest_tick()
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.call_app_for('admin-digest', '/api/cron/resumen');
$$;

-- Las fotos se borran por la API de Storage, no desde SQL: la base le pide la limpieza a la
-- aplicación. La vuelta la anota la ruta al terminar.
create or replace function public.daily_cleanup_tick()
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.call_app_for('daily-cleanup', '/api/cron/limpieza');
$$;

-- La vigilancia vive en la aplicación porque el aviso sale al registro de errores (research R7). No
-- es una tarea vigilada: si no llega, la de Vercel cubre el día.
create or replace function public.task_watch_tick()
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.call_app('/api/cron/vigilancia');
$$;

-- La última llamada de cada tarea que no respondió 2xx o que no tuvo respuesta (se cortó, no
-- conectó), entre las que `pg_net` todavía guarda (6 horas). Una que espera su respuesta no está.
create or replace function public.list_failed_task_calls()
returns table (task text, status_code integer, called_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct on (c.task) c.task, r.status_code, c.called_at
    from private.task_calls c
    join net._http_response r on r.id = c.request_id
   where r.status_code is null or r.status_code not between 200 and 299
   order by c.task, c.called_at desc;
$$;

-- Los avisos de vencimiento de identidad se toman y se marcan antes de mandar, como los
-- recordatorios (#59): dos vueltas a la vez no mandan el mismo correo dos veces (FR-042), y uno que
-- no salió no se reintenta (#11, FR-026).
create or replace function public.claim_identity_expiry_notices()
returns table (user_id uuid, expired_on date, notice_origin text)
language sql
security definer
set search_path = ''
as $$
  with picked as (
    select e.user_id, e.notice_origin
      from public.identity_expirations e
     where e.notice_pending
       for update skip locked
  )
  update public.identity_expirations e
     set notice_pending = false, notice_origin = null
    from picked
   where e.user_id = picked.user_id
  returning e.user_id, e.expired_on, picked.notice_origin;
$$;

-- Supabase concede `execute` a anon y authenticated sobre toda función nueva de public.
revoke all on function private.task_ran(text) from public, anon, authenticated, service_role;
revoke all on function private.call_app(text) from public, anon, authenticated, service_role;
revoke all on function private.call_app_for(text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.record_task_run(text) from public, anon, authenticated;
revoke all on function public.list_task_runs() from public, anon, authenticated;
revoke all on function public.claim_task_alert(text) from public, anon, authenticated;
revoke all on function public.daily_cleanup_tick() from public, anon, authenticated;
revoke all on function public.task_watch_tick() from public, anon, authenticated;
revoke all on function public.list_failed_task_calls() from public, anon, authenticated;
revoke all on function public.claim_identity_expiry_notices() from public, anon, authenticated;

grant execute on function public.record_task_run(text) to service_role;
grant execute on function public.list_task_runs() to service_role;
grant execute on function public.claim_task_alert(text) to service_role;
grant execute on function public.list_failed_task_calls() to service_role;
grant execute on function public.claim_identity_expiry_notices() to service_role;

-- ---------------------------------------------------------------------------------------------
-- Los trabajos de `pg_cron`
-- ---------------------------------------------------------------------------------------------

-- `cron.schedule` con un nombre que ya existe reemplaza su comando. Cada tarea anota su vuelta en
-- el mismo comando, después de la llamada: si la función falla (también sin los secretos de Vault),
-- la vuelta no se anota y la vigilancia la ve atrasada. Lo que la aplicación responde llega después,
-- aparte: la vigilancia lo lee con `list_failed_task_calls`. Los comandos de antes, copiados de sus
-- migraciones.
select cron.schedule(
  'pet-lifecycle',
  '*/5 * * * *',
  $job$select public.pet_lifecycle_tick(); select private.task_ran('pet-lifecycle')$job$
);
select cron.schedule(
  'identity-expire',
  '*/5 * * * *',
  $job$select public.expire_identity_requests(30, 1); select private.task_ran('identity-expire')$job$
);
select cron.schedule(
  'identity-expiry-mail',
  '*/5 * * * *',
  $job$select public.identity_expiry_mail_tick(); select private.task_ran('identity-expiry-mail')$job$
);
select cron.schedule(
  'follow-ups',
  '10 * * * *',
  $job$select public.run_follow_up_tick(); select private.task_ran('follow-ups')$job$
);
select cron.schedule(
  'admin-digest',
  '0 11 * * *',
  $job$select public.admin_digest_tick(); select private.task_ran('admin-digest')$job$
);
select cron.schedule(
  'pet-renewal-links-purge',
  '17 4 * * *',
  $job$delete from public.pet_renewal_links where expires_at < now() - interval '1 day'; select private.task_ran('pet-renewal-links-purge')$job$
);
select cron.schedule(
  'withheld-numbers-purge',
  '29 4 * * *',
  $job$select public.purge_withheld_numbers(); select private.task_ran('withheld-numbers-purge')$job$
);

-- Los pedidos de código de más de 24 horas y los números a medias de más de 7 días (#10, KL-016):
-- son WINDOW_HOURS y PENDING_TTL_DAYS, escritos acá porque nadie de la aplicación está para
-- pasarlos; un test de base los compara.
select cron.schedule(
  'phone-records-purge',
  '41 4 * * *',
  $job$select public.purge_phone_records('24 hours', '7 days'); select private.task_ran('phone-records-purge')$job$
);
select cron.schedule('daily-cleanup', '53 4 * * *', 'select public.daily_cleanup_tick()');
-- El historial de `pg_cron` no crece solo, un aviso de hace un mes no sirve para nada, y la llamada
-- de ayer ya no tiene respuesta guardada en `pg_net`.
select cron.schedule(
  'cron-history-purge',
  '7 5 * * *',
  $job$delete from cron.job_run_details where end_time < now() - interval '7 days'; delete from private.task_alerts where alerted_on < public.uruguay_today() - 30; delete from private.task_calls where called_at < now() - interval '1 day'; select private.task_ran('cron-history-purge')$job$
);
select cron.schedule('task-watch', '*/15 * * * *', 'select public.task_watch_tick()');
