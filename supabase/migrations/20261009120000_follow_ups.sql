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
-- publicar. Nada del contenido.
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
        join public.follow_ups f on f.adoption_id = d.id
       where p.owner_id = (select auth.uid())
         and d.kind = 'site'
       order by d.pet_id, d.marked_at desc
    ) l
   where l.status <> 'skipped';
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
