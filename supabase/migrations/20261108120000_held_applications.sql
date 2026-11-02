-- Solicitudes que esperan la identidad (historia #289): quien tiene su pedido de identidad en
-- revisión deja escrita la solicitud, que sale sola al aprobarse. Vive en una tabla propia que solo
-- leen funciones de quien la escribió, así ninguna lectura de quien publicó ni de quien administra
-- puede filtrarla (research R1). Al salir se convierte en una fila de `applications` con el mismo id
-- y el mismo intento, y la de acá se borra; al no salir pierde las respuestas.

create or replace function private.held_ttl()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '14 days';
$$;

-- ---------------------------------------------------------------------------------------------
-- Las tablas
-- ---------------------------------------------------------------------------------------------

create table public.held_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  publisher_id uuid references auth.users (id) on delete set null,
  attempt_id uuid not null,
  answers jsonb,
  pet_name text not null,
  litter_name text,
  status text not null default 'waiting',
  lapse_reason text,
  written_at timestamptz not null default now(),
  expires_at timestamptz not null,
  changed_at timestamptz not null default now(),

  constraint held_applications_attempt_unique unique (applicant_id, attempt_id),
  constraint held_applications_answers_shape check (
    answers is null or private.application_answers_shape(answers)
  ),
  constraint held_applications_status_valid check (status in ('waiting', 'lapsed')),
  constraint held_applications_lapse_reason_valid check (
    lapse_reason in (
      'expired', 'withdrawn', 'adopted', 'unpublished', 'not_receiving', 'you_blocked',
      'suspended', 'capped'
    )
  ),
  constraint held_applications_lapse_reason_matches check (
    (status = 'lapsed') = (lapse_reason is not null)
  ),
  constraint held_applications_answers_while_waiting check (
    (status = 'waiting') = (answers is not null)
  )
);

create unique index held_applications_one_waiting_idx on public.held_applications (applicant_id, pet_id)
  where status = 'waiting';
create index held_applications_applicant_idx on public.held_applications (applicant_id, written_at desc);
create index held_applications_pet_idx on public.held_applications (pet_id) where status = 'waiting';
create index held_applications_expiry_idx on public.held_applications (expires_at)
  where status = 'waiting';

comment on table public.held_applications is
  'Solicitudes escritas con la identidad en revisión. Mientras esperan, sus respuestas las ve solo '
  'quien las escribió: ni quien publicó ni quien administra saben que existen (FR-017, FR-018).';

alter table public.held_applications enable row level security;
revoke all on public.held_applications from public, anon, authenticated;

-- Lo que la medición necesita de cada salida y de cada final sin salir, sin persona ni animal
-- (research R10). La ruta de las publicaciones lo toma y lo borra.
create table public.held_application_moments (
  id bigint generated always as identity primary key,
  kind text not null,
  reason text,
  applicant_level smallint,
  publisher_level smallint,
  litter boolean not null,
  created_at timestamptz not null default now(),

  constraint held_application_moments_kind_valid check (kind in ('released', 'lapsed')),
  constraint held_application_moments_reason_matches check ((kind = 'lapsed') = (reason is not null))
);

comment on table public.held_application_moments is
  'Momentos de las solicitudes que esperan, para la medición; sin personas ni animales.';

alter table public.held_application_moments enable row level security;
revoke all on public.held_application_moments from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- La regla del correo de solicitud nueva, en un lugar (#65, #257)
-- ---------------------------------------------------------------------------------------------

-- No sale si quien publicó ya tiene de ese animal otra nueva sin abrir desde su última visita,
-- contando las que volvieron a ser nuevas al aprobarse una identidad pedida.
create function private.queue_new_application_notice(p_app uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.applications%rowtype;
begin
  select * into v_app from public.applications a where a.id = p_app;
  if not found then
    return;
  end if;

  if not exists (
    select 1
      from public.applications a
      left join public.application_reviews r on r.application_id = a.id
      left join public.application_identity_asks k on k.application_id = a.id
     where a.pet_id = v_app.pet_id
       and a.id <> v_app.id
       and a.status = 'sent'
       and r.opened_at is null
       and greatest(a.sent_at, coalesce(k.resolved_at, '-infinity'::timestamptz)) > coalesce(
         (
           select iv.seen_at
             from public.inbox_visits iv
            where iv.publisher_id = v_app.publisher_id
              and iv.pet_id = v_app.pet_id
         ),
         '-infinity'::timestamptz
       )
  ) then
    insert into public.application_notices (kind, application_id, recipient_id)
    values ('new_application', v_app.id, v_app.publisher_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- No salir (research R6)
-- ---------------------------------------------------------------------------------------------

-- Pasa a `lapsed` las que siguen esperando, con las respuestas en nulo en la misma sentencia
-- (FR-030), el nombre y la camada de ahora por si el animal se borra, y su momento.
create function private.lapse_held_applications(p_ids uuid[], p_reason text)
returns void
language sql
security definer
set search_path = ''
as $$
  with lapsed as (
    update public.held_applications h
       set status = 'lapsed',
           lapse_reason = p_reason,
           answers = null,
           changed_at = now(),
           pet_name = coalesce((select p.name from public.pets p where p.id = h.pet_id), h.pet_name),
           litter_name = coalesce(private.litter_name_of(h.pet_id), h.litter_name)
     where h.id = any (p_ids)
       and h.status = 'waiting'
    returning h.applicant_id, h.publisher_id, h.litter_name
  )
  insert into public.held_application_moments (kind, reason, applicant_level, publisher_level, litter)
  select 'lapsed',
         p_reason,
         private.person_level(l.applicant_id),
         case when l.publisher_id is not null then private.person_level(l.publisher_id) end,
         l.litter_name is not null
    from lapsed l;
$$;

create function private.held_applications_lapse_on_pet_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text;
begin
  v_reason := case
                when new.taken_down_at is not null and old.taken_down_at is null then 'unpublished'
                when new.status = 'adopted' and old.status <> 'adopted' then 'adopted'
              end;
  if v_reason is not null then
    perform private.lapse_held_applications(
      array(
        select h.id from public.held_applications h where h.pet_id = new.id and h.status = 'waiting'
      ),
      v_reason
    );
  end if;
  return null;
end;
$$;

create trigger held_applications_lapse_on_pet_change
  after update of status, taken_down_at on public.pets
  for each row execute function private.held_applications_lapse_on_pet_change();

-- Antes del borrado, mientras el animal todavía tiene nombre y camada. El borrado de la cuenta de
-- quien publicó borra sus animales en cascada y pasa por acá.
create function private.held_applications_lapse_on_pet_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lapse_held_applications(
    array(
      select h.id from public.held_applications h where h.pet_id = old.id and h.status = 'waiting'
    ),
    'unpublished'
  );
  return old;
end;
$$;

create trigger held_applications_lapse_on_pet_delete
  before delete on public.pets
  for each row execute function private.held_applications_lapse_on_pet_delete();

-- Quien publicó bloquea: «ya no recibe solicitudes», nunca que la bloquearon (decisión del
-- 2026-10-06). Quien solicitó bloquea: el motivo de un bloqueo propio.
create function private.held_applications_lapse_on_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lapse_held_applications(
    array(
      select h.id
        from public.held_applications h
       where h.applicant_id = new.blocked_id
         and h.publisher_id = new.blocker_id
         and h.status = 'waiting'
    ),
    'not_receiving'
  );
  perform private.lapse_held_applications(
    array(
      select h.id
        from public.held_applications h
       where h.applicant_id = new.blocker_id
         and h.publisher_id = new.blocked_id
         and h.status = 'waiting'
    ),
    'you_blocked'
  );
  return null;
end;
$$;

create trigger held_applications_lapse_on_block
  after insert on public.blocks
  for each row execute function private.held_applications_lapse_on_block();

create function private.held_applications_lapse_on_suspension()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lapse_held_applications(
    array(
      select h.id
        from public.held_applications h
       where h.applicant_id = new.user_id
         and h.status = 'waiting'
    ),
    'suspended'
  );
  perform private.lapse_held_applications(
    array(
      select h.id
        from public.held_applications h
       where h.publisher_id = new.user_id
         and h.status = 'waiting'
    ),
    'unpublished'
  );
  return null;
end;
$$;

create trigger held_applications_lapse_on_suspension
  after insert on public.account_suspensions
  for each row execute function private.held_applications_lapse_on_suspension();

-- ---------------------------------------------------------------------------------------------
-- Mandar y dejar escrita (research R3)
-- ---------------------------------------------------------------------------------------------

-- La de #257 con las que esperan: una para el mismo animal devuelve `has_held` y el límite las
-- cuenta (FR-005, FR-010). La regla del correo vive en `queue_new_application_notice`.
create or replace function public.submit_application(
  p_applicant uuid,
  p_attempt uuid,
  p_code text,
  p_answers jsonb,
  p_pending_ttl interval
)
returns table (outcome text, application_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_pet public.pets%rowtype;
  v_receiving text;
begin
  perform public.lock_phone_account(p_applicant);

  select a.id into v_id
    from public.applications a
   where a.applicant_id = p_applicant
     and a.attempt_id = p_attempt;
  if v_id is not null then
    return query select 'already', v_id;
    return;
  end if;

  select * into v_pet from public.pets p where p.code = p_code;
  if not found then
    return query select 'not_found', null::uuid;
    return;
  end if;
  if v_pet.owner_id = p_applicant then
    return query select 'own', null::uuid;
    return;
  end if;
  if exists (
    select 1 from public.blocks b where b.blocker_id = p_applicant and b.blocked_id = v_pet.owner_id
  ) then
    return query select 'you_blocked', null::uuid;
    return;
  end if;

  v_receiving := private.pet_receives_applications(v_pet);
  if v_receiving = 'unavailable' then
    return query select 'unavailable', null::uuid;
    return;
  end if;
  if v_receiving = 'closed' or exists (
    select 1 from public.blocks b where b.blocker_id = v_pet.owner_id and b.blocked_id = p_applicant
  ) then
    return query select 'not_receiving', null::uuid;
    return;
  end if;

  select a.id into v_id
    from public.applications a
   where a.applicant_id = p_applicant
     and a.pet_id = v_pet.id
     and a.status in ('sent', 'accepted');
  if v_id is not null then
    return query select 'has_active', v_id;
    return;
  end if;

  if exists (
    select 1
      from public.held_applications h
     where h.applicant_id = p_applicant
       and h.pet_id = v_pet.id
       and h.status = 'waiting'
  ) then
    return query select 'has_held', null::uuid;
    return;
  end if;

  if exists (
    select 1
      from public.applications a
     where a.applicant_id = p_applicant
       and a.pet_id = v_pet.id
       and a.status = 'rejected'
  ) then
    return query select 'rejected', null::uuid;
    return;
  end if;

  if private.active_application_count(p_applicant) >= private.max_active_applications() then
    return query select 'limit', null::uuid;
    return;
  end if;

  if not public.identity_level_one(p_applicant, p_pending_ttl) then
    return query select 'needs_phone', null::uuid;
    return;
  end if;
  if v_pet.required_level = 2 and not private.has_level_two(p_applicant, p_pending_ttl) then
    return query select 'needs_identity', null::uuid;
    return;
  end if;

  if not private.application_answers_valid(p_answers, v_pet.is_neutered) then
    return query select 'answers_invalid', null::uuid;
    return;
  end if;

  insert into public.applications (applicant_id, pet_id, publisher_id, attempt_id, answers, pet_name)
  values (p_applicant, v_pet.id, v_pet.owner_id, p_attempt, p_answers, v_pet.name)
  returning id into v_id;

  perform private.queue_new_application_notice(v_id);

  return query select 'sent', v_id;
end;
$$;

-- Las activas que ocupan lugar: esperando respuesta, aceptadas y las que esperan la identidad.
create function private.active_application_count(p_applicant uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select (
    select count(*)::integer
      from public.applications a
     where a.applicant_id = p_applicant
       and a.status in ('sent', 'accepted')
  ) + (
    select count(*)::integer
      from public.held_applications h
     where h.applicant_id = p_applicant
       and h.status = 'waiting'
  );
$$;

-- Los candados en el orden teléfono → identidad: `submit_application` toma solo el primero y
-- `resolve_identity_request` solo el segundo, así no forman ciclo. Quien ya tiene nivel 2, o pide un
-- animal que no pide identidad, manda como siempre (FR-006). Sin un pedido en revisión no se guarda
-- nada (spec §Assumptions).
create function public.hold_application(
  p_applicant uuid,
  p_attempt uuid,
  p_code text,
  p_answers jsonb,
  p_pending_ttl interval
)
returns table (outcome text, held_id uuid, application_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_pet public.pets%rowtype;
  v_receiving text;
begin
  perform public.lock_phone_account(p_applicant);
  perform public.lock_identity_account(p_applicant);

  select h.id into v_id
    from public.held_applications h
   where h.applicant_id = p_applicant
     and h.attempt_id = p_attempt;
  if v_id is not null then
    return query select 'already', v_id, null::uuid;
    return;
  end if;
  select a.id into v_id
    from public.applications a
   where a.applicant_id = p_applicant
     and a.attempt_id = p_attempt;
  if v_id is not null then
    return query select 'already', null::uuid, v_id;
    return;
  end if;

  select * into v_pet from public.pets p where p.code = p_code;
  if not found then
    return query select 'not_found', null::uuid, null::uuid;
    return;
  end if;
  if v_pet.owner_id = p_applicant then
    return query select 'own', null::uuid, null::uuid;
    return;
  end if;
  if exists (
    select 1 from public.blocks b where b.blocker_id = p_applicant and b.blocked_id = v_pet.owner_id
  ) then
    return query select 'you_blocked', null::uuid, null::uuid;
    return;
  end if;

  v_receiving := private.pet_receives_applications(v_pet);
  if v_receiving = 'unavailable' then
    return query select 'unavailable', null::uuid, null::uuid;
    return;
  end if;
  if v_receiving = 'closed' or exists (
    select 1 from public.blocks b where b.blocker_id = v_pet.owner_id and b.blocked_id = p_applicant
  ) then
    return query select 'not_receiving', null::uuid, null::uuid;
    return;
  end if;

  select a.id into v_id
    from public.applications a
   where a.applicant_id = p_applicant
     and a.pet_id = v_pet.id
     and a.status in ('sent', 'accepted');
  if v_id is not null then
    return query select 'has_active', null::uuid, v_id;
    return;
  end if;

  select h.id into v_id
    from public.held_applications h
   where h.applicant_id = p_applicant
     and h.pet_id = v_pet.id
     and h.status = 'waiting';
  if v_id is not null then
    return query select 'has_held', v_id, null::uuid;
    return;
  end if;

  if exists (
    select 1
      from public.applications a
     where a.applicant_id = p_applicant
       and a.pet_id = v_pet.id
       and a.status = 'rejected'
  ) then
    return query select 'rejected', null::uuid, null::uuid;
    return;
  end if;

  if private.active_application_count(p_applicant) >= private.max_active_applications() then
    return query select 'limit', null::uuid, null::uuid;
    return;
  end if;

  if not public.identity_level_one(p_applicant, p_pending_ttl) then
    return query select 'needs_phone', null::uuid, null::uuid;
    return;
  end if;

  if v_pet.required_level <> 2 or private.has_level_two(p_applicant, p_pending_ttl) then
    return query
      select s.outcome, null::uuid, s.application_id
        from public.submit_application(p_applicant, p_attempt, p_code, p_answers, p_pending_ttl) s;
    return;
  end if;

  if not exists (
    select 1 from public.identity_requests r where r.user_id = p_applicant and r.expires_at > now()
  ) then
    return query select 'needs_identity', null::uuid, null::uuid;
    return;
  end if;

  if not private.application_answers_valid(p_answers, v_pet.is_neutered) then
    return query select 'answers_invalid', null::uuid, null::uuid;
    return;
  end if;

  insert into public.held_applications (
    applicant_id, pet_id, publisher_id, attempt_id, answers, pet_name, litter_name, expires_at
  )
  values (
    p_applicant, v_pet.id, v_pet.owner_id, p_attempt, p_answers, v_pet.name,
    private.litter_name_of(v_pet.id), now() + private.held_ttl()
  )
  returning id into v_id;

  return query select 'held', v_id, null::uuid;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Salir (research R4, R5)
-- ---------------------------------------------------------------------------------------------

-- Corre con el candado de identidad de la persona tomado. Cada una que puede salir se convierte en
-- una solicitud común con el mismo id y el mismo intento, `sent_at` de ahora y el aviso con la regla
-- de siempre (FR-021); el id compartido deja que un retiro tardío encuentre la que ya salió. Si el
-- animal pasó a castrado, el compromiso de castración ya no corresponde y se saca.
create function private.release_held_applications(p_user uuid)
returns table (
  held_id uuid,
  outcome text,
  pet_name text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_held public.held_applications%rowtype;
  v_pet public.pets%rowtype;
  v_two boolean := private.has_level_two(p_user, private.pending_ttl());
  v_answers jsonb;
begin
  for v_held in
    select h.*
      from public.held_applications h
     where h.applicant_id = p_user
       and h.status = 'waiting'
     order by h.written_at, h.id
       for update
  loop
    held_id := v_held.id;
    expires_at := v_held.expires_at;
    select * into v_pet from public.pets p where p.id = v_held.pet_id;
    pet_name := coalesce(v_pet.name, v_held.pet_name);

    if v_held.expires_at <= now() then
      perform private.lapse_held_applications(array[v_held.id], 'expired');
      outcome := 'lapsed';
    elsif v_two
      and v_pet.id is not null
      and private.pet_receives_applications(v_pet) = 'yes'
      and not exists (
        select 1
          from public.blocks b
         where (b.blocker_id = p_user and b.blocked_id = v_pet.owner_id)
            or (b.blocker_id = v_pet.owner_id and b.blocked_id = p_user)
      )
      and not exists (
        select 1
          from public.applications a
         where a.applicant_id = p_user
           and a.pet_id = v_pet.id
           and a.status in ('sent', 'accepted')
      )
    then
      v_answers := case when v_pet.is_neutered then v_held.answers - 'neuter_commitment'
                        else v_held.answers end;
      insert into public.applications (
        id, applicant_id, pet_id, publisher_id, attempt_id, answers, pet_name
      )
      values (
        v_held.id, p_user, v_pet.id, v_pet.owner_id, v_held.attempt_id, v_answers, v_pet.name
      );
      perform private.queue_new_application_notice(v_held.id);
      insert into public.held_application_moments (kind, applicant_level, publisher_level, litter)
      values (
        'released',
        private.person_level(p_user),
        private.person_level(v_pet.owner_id),
        v_pet.litter_id is not null
      );
      delete from public.held_applications h where h.id = v_held.id;
      outcome := 'released';
    else
      outcome := 'waiting';
    end if;
    return next;
  end loop;
end;
$$;

-- Lo que la aprobación no pudo soltar: el animal que vuelve a recibir (FR-022), el teléfono que se
-- confirma (FR-023) y el plazo (FR-030), con 5 minutos de margen.
create function public.held_applications_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  perform private.lapse_held_applications(
    array(
      select h.id
        from public.held_applications h
       where h.status = 'waiting'
         and h.expires_at <= now()
    ),
    'expired'
  );

  for v_user in
    select distinct h.applicant_id
      from public.held_applications h
      join public.pets p on p.id = h.pet_id
     where h.status = 'waiting'
       and private.pet_receives_applications(p) = 'yes'
       and private.has_level_two(h.applicant_id, private.pending_ttl())
  loop
    perform public.lock_identity_account(v_user);
    perform private.release_held_applications(v_user);
  end loop;
end;
$$;

-- Las que siguen esperando, para los correos de resultado de la identidad (research R9).
create function private.held_mail_lines(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', coalesce((select p.name from public.pets p where p.id = h.pet_id), h.pet_name),
        'outcome', 'waiting',
        'until', (h.expires_at at time zone 'America/Montevideo')::date
      )
      order by h.written_at, h.id
    ),
    '[]'::jsonb
  )
    from public.held_applications h
   where h.applicant_id = p_user
     and h.status = 'waiting';
$$;

-- La de #257 con `held`: al aprobar, lo que pasó con cada una que esperaba; al rechazar, las que
-- siguen esperando con su último día, o todas como `lapsed` si el rechazo llega al tope (FR-027).
drop function public.resolve_identity_request(uuid, uuid, text, integer, integer, interval, text);

create function public.resolve_identity_request(
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
  level_one boolean,
  return_code text,
  return_name text,
  asker_levels smallint[],
  held jsonb
)
language plpgsql
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

  asker_levels := '{}';
  held := '[]'::jsonb;

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

  select r.id, r.user_id, r.sent_at, r.origin, r.expires_at, r.return_pet_id into v_open
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
    select coalesce(
             jsonb_agg(
               jsonb_build_object(
                 'name', x.pet_name,
                 'outcome', x.outcome,
                 'until', case when x.outcome = 'waiting'
                               then (x.expires_at at time zone 'America/Montevideo')::date end
               )
             ),
             '[]'::jsonb
           )
      into held
      from private.release_held_applications(v_owner) x;
    asker_levels := private.resolve_identity_asks(v_owner);
    decision := 'approved';
  else
    insert into public.identity_rejections (user_id, rejected_on, reason)
    values (v_owner, v_today, p_reason);
    if public.identity_retry_on(v_owner, p_window_days, p_cap) is not null then
      select coalesce(
               jsonb_agg(
                 jsonb_build_object('name', h.pet_name, 'outcome', 'lapsed', 'until', null)
                 order by h.written_at, h.id
               ),
               '[]'::jsonb
             )
        into held
        from public.held_applications h
       where h.applicant_id = v_owner
         and h.status = 'waiting';
      perform private.lapse_held_applications(
        array(
          select h.id
            from public.held_applications h
           where h.applicant_id = v_owner
             and h.status = 'waiting'
        ),
        'capped'
      );
    else
      held := private.held_mail_lines(v_owner);
    end if;
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
  select p.code, p.name into return_code, return_name
    from public.pets p
   where p.id = v_open.return_pet_id;
  return next;
end;
$$;

-- La de #169 con las que siguen esperando de cada persona, para el correo del vencimiento.
drop function public.claim_identity_expiry_notices();

create function public.claim_identity_expiry_notices()
returns table (user_id uuid, expired_on date, notice_origin text, held jsonb)
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
  returning e.user_id, e.expired_on, picked.notice_origin, private.held_mail_lines(e.user_id);
$$;

-- Retirar con el candado de identidad, así un retiro y una aprobación simultáneos dejan una sola
-- cosa (FR-025). La que ya salió tiene el mismo id en `applications`.
create function public.withdraw_held_application(p_user uuid, p_id uuid)
returns table (outcome text, application_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  perform public.lock_identity_account(p_user);

  select h.status into v_status
    from public.held_applications h
   where h.id = p_id
     and h.applicant_id = p_user
     for update;

  if v_status = 'waiting' then
    perform private.lapse_held_applications(array[p_id], 'withdrawn');
    return query select 'withdrawn', null::uuid;
    return;
  end if;
  if v_status = 'lapsed' then
    return query select 'closed', null::uuid;
    return;
  end if;
  if exists (
    select 1 from public.applications a where a.id = p_id and a.applicant_id = p_user
  ) then
    return query select 'released', p_id;
    return;
  end if;
  return query select 'not_found', null::uuid;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Lo que lee quien la escribió (research R7)
-- ---------------------------------------------------------------------------------------------

-- `receiving` solo de una que espera y de un animal que se le muestra: dice si hoy recibe. Con
-- `level_two`, a la que espera ya no le falta la identidad sino que el animal reciba (FR-014). Con
-- `needs_request`, no hay pedido en revisión ni identidad aprobada: sale solo si manda las fotos de
-- nuevo antes del último día (FR-013).
create function public.my_held_applications()
returns table (
  id uuid,
  status text,
  lapse_reason text,
  written_at timestamptz,
  expires_at timestamptz,
  changed_at timestamptz,
  code text,
  pet_name text,
  pet_on_view boolean,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  litter_name text,
  receiving text,
  level_two boolean,
  needs_request boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, h.status, h.lapse_reason, h.written_at, h.expires_at, h.changed_at,
         v.code,
         coalesce(v.name, h.pet_name),
         coalesce(v.on_view, false),
         v.cover_id, v.cover_owner, v.cover_width, v.cover_height, v.cover_thumbhash,
         coalesce(case when v.shows then private.litter_name_of(h.pet_id) end, h.litter_name),
         case
           when h.status = 'waiting' and v.shows then (
             select private.pet_receives_applications(p) from public.pets p where p.id = h.pet_id
           )
         end,
         l.two,
         l.needs_request
    from public.held_applications h
    left join lateral private.application_pet(h.pet_id, h.applicant_id) v on true
    cross join (
      select private.has_level_two((select auth.uid()), private.pending_ttl()) as two,
             not exists (
               select 1
                 from public.identity_requests r
                where r.user_id = (select auth.uid())
                  and r.expires_at > now()
             )
             and not exists (
               select 1 from public.identity_verifications iv where iv.user_id = (select auth.uid())
             ) as needs_request
    ) l
   where h.applicant_id = (select auth.uid())
   order by h.status = 'waiting' desc, h.written_at desc, h.id;
$$;

-- La confirmación: sin las respuestas, que no tienen pantalla propia (FR-016).
create function public.my_held_application(p_id uuid)
returns table (
  id uuid,
  status text,
  written_at timestamptz,
  expires_at timestamptz,
  code text,
  pet_name text,
  publisher_name text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  litter_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, h.status, h.written_at, h.expires_at,
         v.code,
         coalesce(v.name, h.pet_name),
         v.publisher_name,
         v.cover_id, v.cover_owner, v.cover_width, v.cover_height, v.cover_thumbhash,
         coalesce(case when v.shows then private.litter_name_of(h.pet_id) end, h.litter_name)
    from public.held_applications h
    left join lateral private.application_pet(h.pet_id, h.applicant_id) v on true
   where h.id = p_id
     and h.applicant_id = (select auth.uid());
$$;

-- La de #278 con las que esperan: `my_held_id`, el conteo y la lista del límite las suman (con su
-- marca `held`), y las respuestas propuestas toman la más reciente de las dos tablas (FR-009).
drop function public.apply_context(uuid, text, interval);

create function public.apply_context(
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
  my_held_id uuid,
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
         (
           select h.id
             from public.held_applications h
            where h.applicant_id = p_applicant
              and h.pet_id = p.id
              and h.status = 'waiting'
         ),
         exists (
           select 1
             from public.applications a
            where a.applicant_id = p_applicant
              and a.pet_id = p.id
              and a.status = 'rejected'
         ),
         private.active_application_count(p_applicant),
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
           select w.answers
             from (
               select a.answers, a.sent_at as at
                 from public.applications a
                where a.applicant_id = p_applicant
               union all
               select h.answers, h.written_at
                 from public.held_applications h
                where h.applicant_id = p_applicant
                  and h.status = 'waiting'
             ) w
            order by w.at desc
            limit 1
         ),
         coalesce(
           (
             select jsonb_agg(x.item order by x.at desc)
               from (
                 select a.sent_at as at,
                        jsonb_build_object(
                          'id', a.id,
                          'sent_at', a.sent_at,
                          'held', false,
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
                        ) as item
                   from public.applications a
                   left join lateral private.application_pet(a.pet_id, p_applicant) v on true
                  where a.applicant_id = p_applicant
                    and a.status in ('sent', 'accepted')
                 union all
                 select h.written_at,
                        jsonb_build_object(
                          'id', h.id,
                          'sent_at', h.written_at,
                          'held', true,
                          'code', v.code,
                          'name', coalesce(v.name, h.pet_name),
                          'cover_id', v.cover_id,
                          'cover_owner', v.cover_owner,
                          'cover_width', v.cover_width,
                          'cover_height', v.cover_height,
                          'cover_thumbhash', v.cover_thumbhash,
                          'litter_name', coalesce(
                            case when v.shows then private.litter_name_of(h.pet_id) end,
                            h.litter_name
                          )
                        )
                   from public.held_applications h
                   left join lateral private.application_pet(h.pet_id, p_applicant) v on true
                  where h.applicant_id = p_applicant
                    and h.status = 'waiting'
               ) x
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

-- Toma y borra los momentos de una vuelta, más viejos primero.
create function public.claim_held_application_moments(p_limit integer)
returns table (
  kind text,
  reason text,
  applicant_level smallint,
  publisher_level smallint,
  litter boolean
)
language sql
security definer
set search_path = ''
as $$
  with picked as (
    select m.id
      from public.held_application_moments m
     order by m.created_at, m.id
     limit p_limit
       for update skip locked
  )
  delete from public.held_application_moments m
   using picked
   where m.id = picked.id
  returning m.kind, m.reason, m.applicant_level, m.publisher_level, m.litter;
$$;

-- La de las camadas, que también despierta por momentos sin tomar.
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
          and p.litter_id is null
          and p.taken_down_at is null
          and p.status in ('available', 'in_process')
          and p.expires_at > now()
          and p.expires_at <= now() + private.pet_reminder_lead()
     )
     and not exists (
       select 1
         from public.pets p
        where p.expiry_counted_at is null
          and p.litter_id is null
          and p.taken_down_at is null
          and p.status in ('available', 'in_process')
          and p.expires_at <= now()
     )
     and not exists (
       select 1
         from public.litters l
        where l.reminder_sent_at is null
          and l.taken_down_at is null
          and l.paused_at is null
          and l.expires_at > now()
          and l.expires_at <= now() + private.pet_reminder_lead()
          and private.litter_state(l) = 'available'
     )
     and not exists (
       select 1
         from public.litters l
        where l.expiry_counted_at is null
          and l.taken_down_at is null
          and l.paused_at is null
          and l.expires_at <= now()
          and private.litter_state(l) = 'expired'
     )
     and not exists (
       select 1
         from public.application_notices n
        where n.created_at <= now() - interval '1 minute'
     )
     and not exists (select 1 from public.follow_ups f where f.measured_at is null)
     and not exists (select 1 from public.follow_up_photo_purges)
     and not exists (select 1 from public.held_application_moments) then
    return;
  end if;

  perform private.call_app_for('pet-lifecycle', '/api/cron/publicaciones');
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.held_ttl() from public, anon, authenticated;
revoke all on function private.queue_new_application_notice(uuid) from public, anon, authenticated;
revoke all on function private.lapse_held_applications(uuid[], text) from public, anon, authenticated;
revoke all on function private.held_applications_lapse_on_pet_change()
  from public, anon, authenticated;
revoke all on function private.held_applications_lapse_on_pet_delete()
  from public, anon, authenticated;
revoke all on function private.held_applications_lapse_on_block() from public, anon, authenticated;
revoke all on function private.held_applications_lapse_on_suspension()
  from public, anon, authenticated;
revoke all on function private.active_application_count(uuid) from public, anon, authenticated;
revoke all on function private.release_held_applications(uuid) from public, anon, authenticated;
revoke all on function private.held_mail_lines(uuid) from public, anon, authenticated;

revoke all on function public.submit_application(uuid, uuid, text, jsonb, interval)
  from public, anon, authenticated;
revoke all on function public.hold_application(uuid, uuid, text, jsonb, interval)
  from public, anon, authenticated;
revoke all on function public.held_applications_tick() from public, anon, authenticated;
revoke all on function public.resolve_identity_request(
  uuid, uuid, text, integer, integer, interval, text
) from public, anon, authenticated;
revoke all on function public.claim_identity_expiry_notices() from public, anon, authenticated;
revoke all on function public.withdraw_held_application(uuid, uuid) from public, anon, authenticated;
revoke all on function public.my_held_applications() from public, anon, authenticated;
revoke all on function public.my_held_application(uuid) from public, anon, authenticated;
revoke all on function public.apply_context(uuid, text, interval) from public, anon, authenticated;
revoke all on function public.claim_held_application_moments(integer)
  from public, anon, authenticated;

-- `resolve_identity_request` corre con los permisos de quien la llama.
grant execute on function private.release_held_applications(uuid) to service_role;
grant execute on function private.held_mail_lines(uuid) to service_role;
grant execute on function private.lapse_held_applications(uuid[], text) to service_role;

grant execute on function public.submit_application(uuid, uuid, text, jsonb, interval)
  to service_role;
grant execute on function public.hold_application(uuid, uuid, text, jsonb, interval)
  to service_role;
grant execute on function public.held_applications_tick() to service_role;
grant execute on function public.resolve_identity_request(
  uuid, uuid, text, integer, integer, interval, text
) to service_role;
grant execute on function public.claim_identity_expiry_notices() to service_role;
grant execute on function public.withdraw_held_application(uuid, uuid) to service_role;
grant execute on function public.my_held_applications() to authenticated;
grant execute on function public.my_held_application(uuid) to authenticated;
grant execute on function public.apply_context(uuid, text, interval) to service_role;
grant execute on function public.claim_held_application_moments(integer) to service_role;

-- ---------------------------------------------------------------------------------------------
-- La tarea
-- ---------------------------------------------------------------------------------------------

insert into private.task_runs (task) values ('held-applications');

select cron.schedule(
  'held-applications',
  '*/5 * * * *',
  $job$select public.held_applications_tick(); select private.task_ran('held-applications')$job$
);
