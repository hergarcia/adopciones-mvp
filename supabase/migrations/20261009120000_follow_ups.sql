-- El seguimiento a los 30 días de cada adopción (historia #69). Una fila de `follow_ups` por adopción
-- (research R1), sin políticas: la leen funciones que miran quién pregunta (R2). El pedido lo hace la
-- base cada hora (R3); un bloqueo queda marcado en la adopción (R4) y cierra el pedido abierto (R5).

-- ---------------------------------------------------------------------------------------------
-- Las tablas
-- ---------------------------------------------------------------------------------------------

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  adoption_id uuid not null references public.adoptions (id) on delete cascade,
  -- Nula en las que no se pidieron: la marca de «no se pide» sobrevive al borrado de la cuenta.
  adopter_id uuid references auth.users (id) on delete cascade,
  status text not null,
  skip_reason text,
  resolved_at timestamptz not null default now(),
  answered_at timestamptz,
  answer_text text,
  closed_at timestamptz,
  close_reason text,
  seen_at timestamptz,
  measured_at timestamptz,

  constraint follow_ups_adoption_unique unique (adoption_id),
  constraint follow_ups_status_valid check (status in ('requested', 'answered', 'closed', 'skipped')),
  constraint follow_ups_skip_reason_valid check (
    skip_reason in ('account_deleted', 'ended', 'declined', 'blocked', 'suspended')
  ),
  constraint follow_ups_skipped_reason check ((status = 'skipped') = (skip_reason is not null)),
  constraint follow_ups_adopter check ((status = 'skipped') = (adopter_id is null)),
  constraint follow_ups_answered check ((status = 'answered') = (answered_at is not null)),
  constraint follow_ups_answer_text check (
    answer_text is null or (status = 'answered' and char_length(answer_text) between 1 and 500)
  ),
  constraint follow_ups_closed check ((status = 'closed') = (closed_at is not null)),
  constraint follow_ups_close_reason_valid check (close_reason in ('ended', 'declined', 'blocked')),
  constraint follow_ups_closed_reason check ((status = 'closed') = (close_reason is not null))
);

comment on table public.follow_ups is
  'El seguimiento a los 30 días de una adopción (historia #69, R1): pedido, respondido, cerrado o no '
  'pedido. Sin políticas: lo leen funciones que eligen según quién mira (R2).';

create index follow_ups_adopter_idx on public.follow_ups (adopter_id);
create index follow_ups_unmeasured_idx on public.follow_ups (resolved_at) where measured_at is null;

alter table public.follow_ups enable row level security;
revoke all on public.follow_ups from anon, authenticated;

-- La respuesta no se edita (FR-013): el estado solo avanza desde `requested` y cada fecha pasa de
-- vacía a un valor una sola vez.
create or replace function private.follow_ups_forward_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.adoption_id is distinct from old.adoption_id
     or new.adopter_id is distinct from old.adopter_id
     or new.resolved_at is distinct from old.resolved_at
     or new.skip_reason is distinct from old.skip_reason
     or (new.status is distinct from old.status
         and not (old.status = 'requested' and new.status in ('answered', 'closed')))
     or (old.status <> 'requested' and (
           new.answered_at is distinct from old.answered_at
           or new.answer_text is distinct from old.answer_text
           or new.closed_at is distinct from old.closed_at
           or new.close_reason is distinct from old.close_reason))
     or (old.seen_at is not null and new.seen_at is distinct from old.seen_at)
     or (old.measured_at is not null and new.measured_at is distinct from old.measured_at) then
    raise exception using errcode = 'P0001', message = 'follow_up_final';
  end if;
  return new;
end;
$$;

create trigger follow_ups_forward_only
  before update on public.follow_ups
  for each row execute function private.follow_ups_forward_only();

-- Borrar la cuenta de quien adoptó se lleva su seguimiento, con el texto y las fotos (FR-053), pero la
-- adopción queda: en su lugar queda la marca de no pedido, sin contenido y ya medida, para que la
-- vuelta horaria no vuelva a resolverla ni a contarla como no pedida (FR-060). Si el pedido todavía no
-- se había medido, esa medición se pierde: es una ventana de una hora contra contarla dos veces.
create or replace function private.follow_ups_keep_resolved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.adopter_id is not null
     and exists (select 1 from public.adoptions d where d.id = old.adoption_id) then
    insert into public.follow_ups (adoption_id, status, skip_reason, resolved_at, measured_at)
    values (old.adoption_id, 'skipped', 'account_deleted', old.resolved_at,
            coalesce(old.measured_at, now()))
    on conflict (adoption_id) do nothing;
  end if;
  return null;
end;
$$;

create trigger follow_ups_keep_resolved
  after delete on public.follow_ups
  for each row execute function private.follow_ups_keep_resolved();

-- Las fotos de una respuesta (R6): en espera (`position` nula) hasta que se manda.
create table public.follow_up_photos (
  id uuid primary key,
  follow_up_id uuid not null references public.follow_ups (id) on delete cascade,
  position smallint,
  width integer not null,
  height integer not null,
  thumbhash text not null,
  staged_at timestamptz not null default now(),

  constraint follow_up_photos_position_valid check (position between 1 and 3),
  constraint follow_up_photos_size_valid check (width > 0 and height > 0)
);

create index follow_up_photos_follow_up_idx on public.follow_up_photos (follow_up_id);
create unique index follow_up_photos_position_idx on public.follow_up_photos (follow_up_id, position)
  where position is not null;
create index follow_up_photos_staged_idx on public.follow_up_photos (staged_at)
  where position is null;

alter table public.follow_up_photos enable row level security;
revoke all on public.follow_up_photos from anon, authenticated;

-- Los objetos que quedaron sin fila (R7): la cascada de cualquier borrado los deja acá.
create table public.follow_up_photo_purges (
  follow_up_id uuid not null,
  photo_id uuid not null,
  queued_at timestamptz not null default now(),
  primary key (follow_up_id, photo_id)
);

alter table public.follow_up_photo_purges enable row level security;
revoke all on public.follow_up_photo_purges from anon, authenticated;

create or replace function private.follow_up_photos_queue_purge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.follow_up_photo_purges (follow_up_id, photo_id)
  values (old.follow_up_id, old.id)
  on conflict do nothing;
  return null;
end;
$$;

create trigger follow_up_photos_queue_purge
  after delete on public.follow_up_photos
  for each row execute function private.follow_up_photos_queue_purge();

-- Sube y firma solo el servicio, después de que una función dijo que corresponde.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('follow-up-photos', 'follow-up-photos', false, 1048576, array['image/webp'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------------------------
-- El bloqueo en la adopción (R4) y el cierre del pedido (R5)
-- ---------------------------------------------------------------------------------------------

alter table public.adoptions add column blocked_at timestamptz;

-- La de #67, con `blocked_at` entre las fechas que no vuelven.
create or replace function private.adoptions_forward_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.pet_id is distinct from old.pet_id
     or new.publisher_id is distinct from old.publisher_id
     or new.kind is distinct from old.kind
     or new.includes_neuter is distinct from old.includes_neuter
     or new.attempt_id is distinct from old.attempt_id
     or new.marked_at is distinct from old.marked_at
     or (new.application_id is distinct from old.application_id and new.application_id is not null)
     or (new.adopter_id is distinct from old.adopter_id and new.adopter_id is not null)
     or (old.adopter_accepted_at is not null and new.adopter_accepted_at is distinct from old.adopter_accepted_at)
     or (old.declined_at is not null and new.declined_at is distinct from old.declined_at)
     or (old.contact_cut_at is not null and new.contact_cut_at is distinct from old.contact_cut_at)
     or (old.ended_at is not null and new.ended_at is distinct from old.ended_at)
     or (old.blocked_at is not null and new.blocked_at is distinct from old.blocked_at) then
    raise exception using errcode = 'P0001', message = 'adoption_final';
  end if;
  return new;
end;
$$;

-- Todas las adopciones entre las dos, en las dos direcciones y también las terminadas: después de
-- volver a publicar, quien lo dio tampoco ve la respuesta (FR-034). Desbloquear no la borra.
create or replace function private.adoptions_mark_blocked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.adoptions d
     set blocked_at = now()
   where d.kind = 'site'
     and d.blocked_at is null
     and (
       (d.publisher_id = new.blocker_id and d.adopter_id = new.blocked_id)
       or (d.publisher_id = new.blocked_id and d.adopter_id = new.blocker_id)
     );
  return null;
end;
$$;

create trigger adoptions_mark_blocked
  after insert on public.blocks
  for each row execute function private.adoptions_mark_blocked();

update public.adoptions d
   set blocked_at = now()
 where d.kind = 'site'
   and exists (
     select 1
       from public.blocks b
      where (b.blocker_id = d.publisher_id and b.blocked_id = d.adopter_id)
         or (b.blocker_id = d.adopter_id and b.blocked_id = d.publisher_id)
   );

-- Volver a publicar, «Yo no adopté» y bloquear ya escriben su fecha en la adopción: engancharse ahí
-- cierra el pedido abierto sin tocar sus funciones. Uno respondido no cambia (FR-023), y la
-- suspensión no cierra (FR-022).
create or replace function private.adoptions_close_follow_up()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text;
begin
  v_reason := case
    when old.ended_at is null and new.ended_at is not null then 'ended'
    when old.declined_at is null and new.declined_at is not null then 'declined'
    when old.blocked_at is null and new.blocked_at is not null then 'blocked'
  end;
  if v_reason is not null then
    update public.follow_ups f
       set status = 'closed', closed_at = now(), close_reason = v_reason
     where f.adoption_id = new.id
       and f.status = 'requested';
  end if;
  return null;
end;
$$;

create trigger adoptions_close_follow_up
  after update of ended_at, declined_at, blocked_at on public.adoptions
  for each row execute function private.adoptions_close_follow_up();

alter table public.application_notices drop constraint application_notices_kind_valid;
alter table public.application_notices add constraint application_notices_kind_valid check (
  kind in (
    'new_application', 'question_answered', 'accepted', 'rejected', 'question_asked',
    'closed_adopted', 'closed_unpublished', 'adoption_marked', 'commitment_accepted',
    'adoption_declined', 'follow_up_requested', 'follow_up_answered'
  )
);

-- ---------------------------------------------------------------------------------------------
-- Las lecturas (R2): con la sesión; lo ajeno, cero filas
-- ---------------------------------------------------------------------------------------------

-- El seguimiento de la adopción más reciente de una solicitud, solo a las dos personas. A quien lo
-- dio, después de un bloqueo, sin la fecha, el texto ni las fotos (FR-034).
create or replace function public.follow_up_of(p_application uuid)
returns table (
  follow_up_id uuid,
  side text,
  status text,
  requested_at timestamptz,
  answered_at timestamptz,
  answer_text text,
  photos jsonb,
  can_answer boolean,
  hidden boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id,
         o.side,
         f.status,
         f.resolved_at,
         case when o.hidden then null else f.answered_at end,
         case when o.hidden then null else f.answer_text end,
         case
           when o.hidden then '[]'::jsonb
           else coalesce((
             select jsonb_agg(
                      jsonb_build_object(
                        'id', ph.id, 'width', ph.width, 'height', ph.height,
                        'thumbhash', ph.thumbhash
                      ) order by ph.position)
               from public.follow_up_photos ph
              where ph.follow_up_id = f.id
                and ph.position is not null
           ), '[]'::jsonb)
         end,
         o.side = 'adopter' and f.status = 'requested',
         o.hidden
    from (
      select d.*
        from public.adoptions d
       where d.application_id = p_application
         and (
           d.publisher_id = (select auth.uid())
           or (d.adopter_id = (select auth.uid()) and d.declined_at is null)
         )
       order by d.marked_at desc
       limit 1
    ) d
    join public.follow_ups f on f.adoption_id = d.id
    cross join lateral (
      select case when d.publisher_id = (select auth.uid()) then 'publisher' else 'adopter' end as side,
             d.publisher_id = (select auth.uid()) and d.blocked_at is not null as hidden
    ) o
   where f.status <> 'skipped'
     and not private.is_suspended((select auth.uid()));
$$;

-- Para cada animal propio, el seguimiento de su adopción más reciente, también si se volvió a
-- publicar, hasta que se adopte otra vez: la más reciente se elige entre todas, por el sitio o por
-- fuera y con seguimiento o sin él todavía, y sin uno a la vista no hay fila. Nada del contenido.
create or replace function public.my_pet_follow_ups()
returns table (
  pet_id uuid,
  application_id uuid,
  status text,
  requested_at timestamptz,
  answered_at timestamptz,
  adoption_current boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.pet_id, l.application_id, l.status, l.resolved_at, l.answered_at, l.adoption_current
    from (
      select distinct on (d.pet_id)
             d.pet_id, d.application_id, f.status, f.resolved_at,
             case when d.blocked_at is null then f.answered_at end as answered_at,
             d.ended_at is null as adoption_current
        from public.adoptions d
        join public.pets p on p.id = d.pet_id
        left join public.follow_ups f on f.adoption_id = d.id
       where p.owner_id = (select auth.uid())
       order by d.pet_id, d.marked_at desc
    ) l
   where l.status is not null
     and l.status <> 'skipped';
$$;

-- Las solicitudes de quien mira con un pedido abierto («Contá cómo va»).
create or replace function public.my_open_follow_ups()
returns table (application_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select d.application_id
    from public.follow_ups f
    join public.adoptions d on d.id = f.adoption_id
   where f.adopter_id = (select auth.uid())
     and f.status = 'requested'
     and d.application_id is not null;
$$;

-- ---------------------------------------------------------------------------------------------
-- El pedido (R3) y la limpieza de las fotos en espera (R7)
-- ---------------------------------------------------------------------------------------------

-- Las adopciones del sitio sin seguimiento cuyo día 30 de Uruguay ya llegó: «ya llegó» y no «es hoy»
-- recupera una vuelta perdida (FR-003), y el `unique` impide un segundo pedido aunque dos vueltas se
-- pisen. Las condiciones se miran en esta vuelta (FR-002); la que falla queda como no pedida, para
-- siempre, con el primer motivo.
create or replace function private.request_due_follow_ups()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_adoption public.adoptions%rowtype;
  v_reason text;
begin
  for v_adoption in
    select d.*
      from public.adoptions d
     where d.kind = 'site'
       and (d.marked_at at time zone 'America/Montevideo')::date + 30
           <= (now() at time zone 'America/Montevideo')::date
       and not exists (select 1 from public.follow_ups f where f.adoption_id = d.id)
     order by d.marked_at
       for update of d skip locked
  loop
    v_reason := case
      when v_adoption.adopter_id is null or v_adoption.application_id is null then 'account_deleted'
      when v_adoption.ended_at is not null then 'ended'
      when v_adoption.declined_at is not null then 'declined'
      when v_adoption.blocked_at is not null or exists (
        select 1
          from public.blocks b
         where (b.blocker_id = v_adoption.publisher_id and b.blocked_id = v_adoption.adopter_id)
            or (b.blocker_id = v_adoption.adopter_id and b.blocked_id = v_adoption.publisher_id)
      ) then 'blocked'
      when private.is_suspended(v_adoption.publisher_id)
        or private.is_suspended(v_adoption.adopter_id) then 'suspended'
    end;

    if v_reason is null then
      insert into public.follow_ups (adoption_id, adopter_id, status)
      values (v_adoption.id, v_adoption.adopter_id, 'requested')
      on conflict (adoption_id) do nothing;
      if found then
        insert into public.application_notices (kind, application_id, recipient_id)
        values ('follow_up_requested', v_adoption.application_id, v_adoption.adopter_id);
      end if;
    else
      insert into public.follow_ups (adoption_id, status, skip_reason)
      values (v_adoption.id, 'skipped', v_reason)
      on conflict (adoption_id) do nothing;
    end if;
  end loop;
end;
$$;

-- Las fotos en espera de un seguimiento que se cerró o que nunca se mandó; la cola se lleva los
-- objetos.
create or replace function private.purge_stale_follow_up_photos()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.follow_up_photos ph
   where ph.position is null
     and ph.staged_at < now() - interval '24 hours';
$$;

-- La vuelta horaria; los tests y el e2e la corren sin esperar.
create or replace function public.run_follow_up_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.request_due_follow_ups();
  perform private.purge_stale_follow_up_photos();
end;
$$;

-- Medir lo que se resolvió (R11), una sola vez: pedido o no pedido, con el motivo.
create or replace function public.claim_follow_up_events(p_limit integer)
returns table (status text, skip_reason text)
language sql
security definer
set search_path = ''
as $$
  with picked as (
    select f.id
      from public.follow_ups f
     where f.measured_at is null
     order by f.resolved_at
     limit p_limit
       for update skip locked
  )
  update public.follow_ups f
     set measured_at = now()
    from picked
   where f.id = picked.id
  returning case when f.skip_reason is null then 'requested' else 'skipped' end, f.skip_reason;
$$;

-- La de #65, que también llama a la aplicación cuando hay un seguimiento sin medir o fotos sin
-- borrar.
create or replace function public.pet_lifecycle_tick()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
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

  select s.decrypted_secret into v_url from vault.decrypted_secrets s where s.name = 'app_url';
  select s.decrypted_secret into v_secret from vault.decrypted_secrets s where s.name = 'cron_secret';
  if v_url is null or v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := v_url || '/api/cron/publicaciones',
    headers := jsonb_build_object('x-cron-secret', v_secret, 'content-type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.follow_ups_forward_only() from public, anon, authenticated;
revoke all on function private.follow_up_photos_queue_purge() from public, anon, authenticated;
revoke all on function private.follow_ups_keep_resolved() from public, anon, authenticated;
revoke all on function private.adoptions_forward_only() from public, anon, authenticated;
revoke all on function private.adoptions_mark_blocked() from public, anon, authenticated;
revoke all on function private.adoptions_close_follow_up() from public, anon, authenticated;
revoke all on function private.request_due_follow_ups() from public, anon, authenticated;
revoke all on function private.purge_stale_follow_up_photos() from public, anon, authenticated;

revoke all on function public.follow_up_of(uuid) from public, anon, authenticated;
revoke all on function public.my_pet_follow_ups() from public, anon, authenticated;
revoke all on function public.my_open_follow_ups() from public, anon, authenticated;
revoke all on function public.run_follow_up_tick() from public, anon, authenticated;
revoke all on function public.claim_follow_up_events(integer) from public, anon, authenticated;
revoke all on function public.pet_lifecycle_tick() from public, anon, authenticated;

grant execute on function public.follow_up_of(uuid) to authenticated;
grant execute on function public.my_pet_follow_ups() to authenticated;
grant execute on function public.my_open_follow_ups() to authenticated;
grant execute on function public.run_follow_up_tick() to service_role;
grant execute on function public.claim_follow_up_events(integer) to service_role;
grant execute on function public.pet_lifecycle_tick() to service_role;

select cron.schedule('follow-ups', '10 * * * *', 'select public.run_follow_up_tick()');

-- ---------------------------------------------------------------------------------------------
-- Responder (R6): las fotos de a una, la respuesta en una sola llamada con candado
-- ---------------------------------------------------------------------------------------------

-- La foto queda en espera de ese seguimiento antes de que el servicio suba sus objetos: así no hay
-- objetos sin fila. El mismo id otra vez es un reintento.
--   staged      en espera (también si ya estaba)
--   not_found   esa solicitud no tiene un seguimiento a su nombre
--   suspended   su cuenta está suspendida
--   closed      el pedido ya no está abierto (respondido o cerrado)
--   limit       ya hay 9 en espera
create or replace function public.stage_follow_up_photo(
  p_adopter uuid,
  p_application uuid,
  p_photo uuid,
  p_width integer,
  p_height integer,
  p_thumbhash text
)
returns table (outcome text, follow_up_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_follow_up public.follow_ups%rowtype;
begin
  select f.* into v_follow_up
    from public.adoptions d
    join public.follow_ups f on f.adoption_id = d.id
   where d.application_id = p_application
     and f.adopter_id = p_adopter
   order by d.marked_at desc
   limit 1
     for update of f;
  if not found then
    return query select 'not_found', null::uuid;
    return;
  end if;
  if private.is_suspended(p_adopter) then
    return query select 'suspended', v_follow_up.id;
    return;
  end if;
  if v_follow_up.status <> 'requested' then
    return query select 'closed', v_follow_up.id;
    return;
  end if;
  if exists (
    select 1 from public.follow_up_photos ph
     where ph.id = p_photo and ph.follow_up_id = v_follow_up.id and ph.position is null
  ) then
    return query select 'staged', v_follow_up.id;
    return;
  end if;
  -- Un id que ya usó otro seguimiento: como si no existiera, sin decir de quién es.
  if exists (select 1 from public.follow_up_photos ph where ph.id = p_photo) then
    return query select 'not_found', null::uuid;
    return;
  end if;
  if (
    select count(*) from public.follow_up_photos ph
     where ph.follow_up_id = v_follow_up.id and ph.position is null
  ) >= 9 then
    return query select 'limit', v_follow_up.id;
    return;
  end if;

  insert into public.follow_up_photos (id, follow_up_id, width, height, thumbhash)
  values (p_photo, v_follow_up.id, p_width, p_height, p_thumbhash);

  return query select 'staged', v_follow_up.id;
end;
$$;

-- «Mandar» (R6), con la fila tomada: una sola respuesta aunque se toque dos veces (FR-013). Las fotos
-- elegidas quedan en orden y las demás en espera se descartan (la cola se lleva sus objetos). Quien
-- lo dio recibe un aviso si su cuenta no está suspendida. El compromiso no cambia.
--   answered    quedó respondido
--   already     ya estaba respondido: no escribe nada
--   not_found   esa solicitud no tiene un seguimiento a su nombre
--   suspended   su cuenta está suspendida: el pedido sigue abierto (FR-022)
--   closed      el pedido se cerró (volvió a publicarlo, «Yo no adopté», un bloqueo)
--   invalid     0 o más de 3 fotos, alguna que no está en espera de este seguimiento, o el texto largo
create or replace function public.answer_follow_up(
  p_adopter uuid,
  p_application uuid,
  p_photos uuid[],
  p_text text
)
returns table (outcome text, requested_at timestamptz, photo_count integer, has_text boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_follow_up public.follow_ups%rowtype;
  v_publisher uuid;
  v_text text := nullif(btrim(coalesce(p_text, '')), '');
  v_count integer := coalesce(cardinality(p_photos), 0);
begin
  select f.* into v_follow_up
    from public.adoptions d
    join public.follow_ups f on f.adoption_id = d.id
   where d.application_id = p_application
     and f.adopter_id = p_adopter
   order by d.marked_at desc
   limit 1
     for update of f;
  if not found then
    return query select 'not_found', null::timestamptz, 0, false;
    return;
  end if;
  if v_follow_up.status = 'answered' then
    return query
      select 'already', v_follow_up.resolved_at,
             (select count(*)::integer from public.follow_up_photos ph
               where ph.follow_up_id = v_follow_up.id and ph.position is not null),
             v_follow_up.answer_text is not null;
    return;
  end if;
  if private.is_suspended(p_adopter) then
    return query select 'suspended', v_follow_up.resolved_at, 0, false;
    return;
  end if;
  if v_follow_up.status <> 'requested' then
    return query select 'closed', v_follow_up.resolved_at, 0, false;
    return;
  end if;
  if v_count < 1 or v_count > 3
     or (select count(distinct x) from unnest(p_photos) x) <> v_count
     or (
       select count(*) from public.follow_up_photos ph
        where ph.follow_up_id = v_follow_up.id
          and ph.position is null
          and ph.id = any (p_photos)
     ) <> v_count
     or char_length(coalesce(v_text, '')) > 500 then
    return query select 'invalid', v_follow_up.resolved_at, 0, false;
    return;
  end if;

  update public.follow_up_photos ph
     set position = picked.position
    from unnest(p_photos) with ordinality as picked(id, position)
   where ph.id = picked.id;

  delete from public.follow_up_photos ph
   where ph.follow_up_id = v_follow_up.id
     and ph.position is null;

  update public.follow_ups f
     set status = 'answered', answered_at = now(), answer_text = v_text
   where f.id = v_follow_up.id;

  select d.publisher_id into v_publisher
    from public.adoptions d
   where d.id = v_follow_up.adoption_id;
  if v_publisher is not null and not private.is_suspended(v_publisher) then
    insert into public.application_notices (kind, application_id, recipient_id)
    values ('follow_up_answered', p_application, v_publisher);
  end if;

  return query select 'answered', v_follow_up.resolved_at, v_count, v_text is not null;
end;
$$;

-- La primera vez que quien lo dio ve la respuesta (R11): `first` dice si es esta. Nada después de un
-- bloqueo, porque ya no la ve.
create or replace function public.mark_follow_up_seen(p_publisher uuid, p_application uuid)
returns table (first boolean, answered_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_follow_up public.follow_ups%rowtype;
begin
  select f.* into v_follow_up
    from public.adoptions d
    join public.follow_ups f on f.adoption_id = d.id
   where d.application_id = p_application
     and d.publisher_id = p_publisher
     and d.blocked_at is null
     and f.status = 'answered'
   order by d.marked_at desc
   limit 1
     for update of f;
  if not found then
    return;
  end if;
  if v_follow_up.seen_at is not null then
    return query select false, v_follow_up.answered_at;
    return;
  end if;
  update public.follow_ups f set seen_at = now() where f.id = v_follow_up.id;
  return query select true, v_follow_up.answered_at;
end;
$$;

-- El correo «Ana contó cómo va Tobi» (R8): el nombre de hoy de quien adoptó y la primera foto, solo a
-- quien lo dio y sin un bloqueo en el medio. Nunca el texto de la respuesta.
create or replace function public.follow_up_answered_for_email(
  p_application uuid,
  p_recipient uuid
)
returns table (
  adopter_name text,
  pet_name text,
  pet_sex text,
  pet_id uuid,
  follow_up_id uuid,
  first_photo_id uuid
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
         ph.id
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
    left join public.follow_up_photos ph on ph.follow_up_id = f.id and ph.position = 1
   where d.blocked_at is null;
$$;

-- La cola de purga (R7): se toma sin borrar, y se olvida recién cuando Storage borró los objetos.
create or replace function public.claim_follow_up_photo_purges(p_limit integer)
returns table (follow_up_id uuid, photo_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select q.follow_up_id, q.photo_id
    from public.follow_up_photo_purges q
   order by q.queued_at
   limit p_limit;
$$;

create or replace function public.forget_follow_up_photo_purges(p_items jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.follow_up_photo_purges q
   using jsonb_to_recordset(p_items) as gone(follow_up_id uuid, photo_id uuid)
   where q.follow_up_id = gone.follow_up_id
     and q.photo_id = gone.photo_id;
$$;

-- La de #67, que además dice si el seguimiento ya se respondió: entonces no se ofrece «Yo no adopté»
-- (FR-017).
drop function public.adoption_of(uuid);

create function public.adoption_of(p_application uuid)
returns table (
  side text,
  pet_name text,
  pet_sex text,
  includes_neuter boolean,
  publisher_name text,
  adopter_name text,
  marked_at timestamptz,
  adopter_accepted_at timestamptz,
  declined_at timestamptz,
  ended_at timestamptz,
  contact_cut boolean,
  follow_up_answered boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select case when d.publisher_id = (select auth.uid()) then 'publisher' else 'adopter' end,
         coalesce(p.name, a.pet_name),
         p.sex,
         d.includes_neuter,
         pp.display_name,
         pa.display_name,
         d.marked_at, d.adopter_accepted_at, d.declined_at, d.ended_at,
         d.contact_cut_at is not null,
         exists (
           select 1 from public.follow_ups f
            where f.adoption_id = d.id and f.status = 'answered'
         )
    from public.adoptions d
    join public.applications a on a.id = d.application_id
    left join public.pets p on p.id = d.pet_id
    left join public.profiles pp on pp.id = d.publisher_id
    left join public.profiles pa on pa.id = d.adopter_id
   where d.application_id = p_application
     and (
       d.publisher_id = (select auth.uid())
       or (d.adopter_id = (select auth.uid()) and d.declined_at is null)
     )
   order by d.marked_at desc
   limit 1;
$$;

-- La de #67: con el seguimiento respondido, «Yo no adopté» ya no deshace nada (FR-017).
--   answered      el seguimiento ya se respondió: la adopción queda como estaba
create or replace function public.decline_adoption(p_adopter uuid, p_application uuid)
returns table (outcome text, marked_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_adoption public.adoptions%rowtype;
begin
  select * into v_adoption
    from public.adoptions d
   where d.application_id = p_application
     and d.adopter_id = p_adopter
   order by d.marked_at desc
   limit 1
     for update;
  if not found then
    return query select 'not_found', null::timestamptz;
    return;
  end if;
  if v_adoption.declined_at is not null then
    return query select 'already', v_adoption.marked_at;
    return;
  end if;
  if private.is_suspended(p_adopter) then
    return query select 'suspended', v_adoption.marked_at;
    return;
  end if;
  if exists (
    select 1 from public.follow_ups f
     where f.adoption_id = v_adoption.id and f.status = 'answered'
  ) then
    return query select 'answered', v_adoption.marked_at;
    return;
  end if;
  if v_adoption.adopter_accepted_at is not null
     or v_adoption.ended_at is not null
     or v_adoption.contact_cut_at is not null then
    return query select 'closed', v_adoption.marked_at;
    return;
  end if;

  update public.adoptions d set declined_at = now() where d.id = v_adoption.id;

  update public.applications a
     set close_reason = 'adopted', changed_at = now()
   where a.id = p_application
     and a.close_reason = 'handed_over';

  insert into public.application_notices (kind, application_id, recipient_id)
  values ('adoption_declined', p_application, v_adoption.publisher_id);

  return query select 'done', v_adoption.marked_at;
end;
$$;

revoke all on function public.stage_follow_up_photo(uuid, uuid, uuid, integer, integer, text)
  from public, anon, authenticated;
revoke all on function public.answer_follow_up(uuid, uuid, uuid[], text)
  from public, anon, authenticated;
revoke all on function public.mark_follow_up_seen(uuid, uuid) from public, anon, authenticated;
revoke all on function public.follow_up_answered_for_email(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.claim_follow_up_photo_purges(integer) from public, anon, authenticated;
revoke all on function public.forget_follow_up_photo_purges(jsonb) from public, anon, authenticated;
revoke all on function public.adoption_of(uuid) from public, anon, authenticated;
revoke all on function public.decline_adoption(uuid, uuid) from public, anon, authenticated;

grant execute on function public.stage_follow_up_photo(uuid, uuid, uuid, integer, integer, text)
  to service_role;
grant execute on function public.answer_follow_up(uuid, uuid, uuid[], text) to service_role;
grant execute on function public.mark_follow_up_seen(uuid, uuid) to service_role;
grant execute on function public.follow_up_answered_for_email(uuid, uuid) to service_role;
grant execute on function public.claim_follow_up_photo_purges(integer) to service_role;
grant execute on function public.forget_follow_up_photo_purges(jsonb) to service_role;
grant execute on function public.adoption_of(uuid) to authenticated;
grant execute on function public.decline_adoption(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------------------------
-- El historial (R9): dos números públicos, sin animales ni personas
-- ---------------------------------------------------------------------------------------------

-- Cuenta las respondidas, también las terminadas o con un bloqueo después (FR-043); lo que se llevó
-- un borrado ya no tiene fila (FR-044). Una cuenta suspendida no muestra perfil (#13): `0, 0`.
create or replace function private.follow_up_counts(p_user uuid)
returns table (given integer, adopted integer)
language sql
stable
security definer
set search_path = ''
as $$
  select case when p_user is null or private.is_suspended(p_user) then 0 else (
           select count(*)::integer
             from public.adoptions d
             join public.follow_ups f on f.adoption_id = d.id
            where d.publisher_id = p_user
              and f.status = 'answered'
         ) end,
         case when p_user is null or private.is_suspended(p_user) then 0 else (
           select count(*)::integer
             from public.follow_ups f
            where f.adopter_id = p_user
              and f.status = 'answered'
         ) end;
$$;

-- El perfil público y Una solicitud, por el id público de la persona.
create or replace function public.follow_up_history(p_public_id text)
returns table (given integer, adopted integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.given, c.adopted
    from private.follow_up_counts(
      (select p.id from public.profiles p where p.public_id = p_public_id)
    ) c;
$$;

-- La ficha, por el código del animal: `pet_by_code` no da el id público de quien publica fuera del
-- caso del bloqueo, y recrearla para eso tocaría una función grande con sus tests.
create or replace function public.pet_follow_up_history(p_code text)
returns table (given integer, adopted integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.given, c.adopted
    from private.follow_up_counts(
      (select pt.owner_id from public.pets pt where pt.code = p_code)
    ) c;
$$;

revoke all on function private.follow_up_counts(uuid) from public, anon, authenticated;
revoke all on function public.follow_up_history(text) from public, anon, authenticated;
revoke all on function public.pet_follow_up_history(text) from public, anon, authenticated;
grant execute on function public.follow_up_history(text) to anon, authenticated;
grant execute on function public.pet_follow_up_history(text) to anon, authenticated;
