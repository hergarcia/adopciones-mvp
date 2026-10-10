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

-- `private` no lo publica la API, pero tiene `usage` para anon y authenticated (lo usan otras
-- funciones). Sin permisos y con RLS sin políticas: si algún día se publicara, no se lee nada.
alter table private.task_runs enable row level security;
alter table private.task_alerts enable row level security;
revoke all on private.task_runs from public, anon, authenticated, service_role;
revoke all on private.task_alerts from public, anon, authenticated, service_role;

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

-- Las fotos se borran por la API de Storage, no desde SQL: la base le pide la limpieza a la
-- aplicación, como `identity_expiry_mail_tick`. La vuelta la anota la ruta al terminar.
create or replace function public.daily_cleanup_tick()
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
    url := v_url || '/api/cron/limpieza',
    headers := jsonb_build_object('x-cron-secret', v_secret, 'content-type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

-- La vigilancia vive en la aplicación porque el aviso sale al registro de errores (research R7).
create or replace function public.task_watch_tick()
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
    url := v_url || '/api/cron/vigilancia',
    headers := jsonb_build_object('x-cron-secret', v_secret, 'content-type', 'application/json'),
    body := '{}'::jsonb
  );
end;
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
revoke all on function public.record_task_run(text) from public, anon, authenticated;
revoke all on function public.list_task_runs() from public, anon, authenticated;
revoke all on function public.claim_task_alert(text) from public, anon, authenticated;
revoke all on function public.daily_cleanup_tick() from public, anon, authenticated;
revoke all on function public.task_watch_tick() from public, anon, authenticated;
revoke all on function public.claim_identity_expiry_notices() from public, anon, authenticated;

grant execute on function public.record_task_run(text) to service_role;
grant execute on function public.list_task_runs() to service_role;
grant execute on function public.claim_task_alert(text) to service_role;
grant execute on function public.claim_identity_expiry_notices() to service_role;

-- ---------------------------------------------------------------------------------------------
-- Los trabajos de `pg_cron`
-- ---------------------------------------------------------------------------------------------

-- `cron.schedule` con un nombre que ya existe reemplaza su comando. Cada tarea anota su vuelta en
-- el mismo comando, después de la llamada: si la llamada falla, la vuelta no se anota y la
-- vigilancia lo ve. Los comandos de antes, copiados de sus migraciones.
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
-- El historial de `pg_cron` no crece solo, y un aviso de hace un mes no sirve para nada.
select cron.schedule(
  'cron-history-purge',
  '7 5 * * *',
  $job$delete from cron.job_run_details where end_time < now() - interval '7 days'; delete from private.task_alerts where alerted_on < public.uruguay_today() - 30; select private.task_ran('cron-history-purge')$job$
);
select cron.schedule('task-watch', '*/15 * * * *', 'select public.task_watch_tick()');
