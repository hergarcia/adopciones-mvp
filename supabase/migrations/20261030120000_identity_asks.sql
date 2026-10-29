-- Pedirle la identidad a quien solicitó desde su solicitud (historia #257): una fila por solicitud
-- con el día del pedido y el de la aprobación, los dos avisos por correo, la resolución dentro de la
-- aprobación de la identidad y el origen `asked` en la pregunta de por qué se deja la verificación
-- (data-model.md, research R1 a R11).

-- ---------------------------------------------------------------------------------------------
-- El pedido (R1, R11)
-- ---------------------------------------------------------------------------------------------

create table public.application_identity_asks (
  application_id uuid primary key references public.applications (id) on delete cascade,
  asked_at timestamptz not null default now(),
  resolved_at timestamptz,

  constraint application_identity_asks_resolved_after check (
    resolved_at is null or resolved_at >= asked_at
  )
);

comment on table public.application_identity_asks is
  'El pedido de identidad de quien publicó, a lo sumo uno por solicitud (historia #257). Lo ven las '
  'dos personas de la solicitud por las funciones que arman cada pantalla; quien administra no lo ve.';

alter table public.application_identity_asks enable row level security;
revoke all on public.application_identity_asks from anon, authenticated;

-- La solicitud sobrevive al borrado de la cuenta de quien publicó (FR-082 de la #63); el pedido no
-- (FR-030).
create function private.identity_asks_drop_on_publisher_gone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.application_identity_asks k where k.application_id = new.id;
  return null;
end;
$$;

create trigger application_identity_asks_on_publisher_gone
  after update of publisher_id on public.applications
  for each row
  when (new.publisher_id is null and old.publisher_id is not null)
  execute function private.identity_asks_drop_on_publisher_gone();

-- ---------------------------------------------------------------------------------------------
-- Los avisos y el origen de la pregunta de por qué se va (R6, R8)
-- ---------------------------------------------------------------------------------------------

alter table public.application_notices drop constraint application_notices_kind_valid;
alter table public.application_notices add constraint application_notices_kind_valid check (
  kind in (
    'new_application', 'question_answered', 'accepted', 'rejected', 'question_asked',
    'closed_adopted', 'closed_unpublished', 'adoption_marked', 'commitment_accepted',
    'adoption_declined', 'follow_up_requested', 'follow_up_answered', 'identity_asked',
    'identity_verified'
  )
);

alter table public.verification_exit_tickets
  drop constraint verification_exit_tickets_origin_valid;
alter table public.verification_exit_tickets
  add constraint verification_exit_tickets_origin_valid
  check (origin in ('publish', 'apply', 'self', 'asked'));

alter table public.verification_exit_answers
  drop constraint verification_exit_answers_origin_valid;
alter table public.verification_exit_answers
  add constraint verification_exit_answers_origin_valid
  check (origin in ('publish', 'apply', 'self', 'asked'));

alter table public.verification_exit_counts
  drop constraint verification_exit_counts_origin_valid;
alter table public.verification_exit_counts
  add constraint verification_exit_counts_origin_valid
  check (origin in ('publish', 'apply', 'self', 'asked'));

insert into public.verification_exit_counts (level, origin)
values ('phone', 'asked'), ('identity', 'asked');

create or replace function public.ask_verification_exit(p_level text, p_origin text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid := (select auth.uid());
  v_ticket uuid;
begin
  if p_origin is null or p_origin not in ('publish', 'apply', 'self', 'asked')
     or not private.verification_exit_eligible(v_person, p_level) then
    return null;
  end if;

  insert into public.verification_exit_asks (person_id, level)
  values (v_person, p_level)
  on conflict do nothing;
  if not found then
    return null;
  end if;

  update public.verification_exit_counts c
     set asked = c.asked + 1
   where c.level = p_level and c.origin = p_origin;
  insert into public.verification_exit_tickets (level, origin)
  values (p_level, p_origin)
  returning ticket into v_ticket;
  return v_ticket;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Pedir (R2)
-- ---------------------------------------------------------------------------------------------

-- Los candados van en el orden de la aprobación —la cuenta de quien solicitó y después la
-- solicitud—, así un pedido y una aprobación simultáneos no dejan un pedido abierto a alguien que
-- ya tiene la identidad. `already` va antes que el estado: un reintento después de que la solicitud
-- se cerró dice que ya se pidió, no un error.
create function public.ask_identity(p_publisher uuid, p_id uuid)
returns table (outcome text, asked_at timestamptz, in_litter boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_applicant uuid;
  v_app public.applications%rowtype;
  v_in_litter boolean;
  v_asked timestamptz;
begin
  select a.applicant_id into v_applicant
    from public.applications a
   where a.id = p_id
     and a.publisher_id = p_publisher;
  if not found then
    return query select 'not_found'::text, null::timestamptz, false;
    return;
  end if;

  perform public.lock_identity_account(v_applicant);

  select * into v_app
    from public.applications a
   where a.id = p_id
     and a.publisher_id = p_publisher
     for update;
  if not found then
    return query select 'not_found'::text, null::timestamptz, false;
    return;
  end if;
  v_in_litter := exists (
    select 1 from public.pets p where p.id = v_app.pet_id and p.litter_id is not null
  );

  select k.asked_at into v_asked
    from public.application_identity_asks k
   where k.application_id = p_id;
  if v_asked is not null then
    return query select 'already'::text, v_asked, v_in_litter;
    return;
  end if;
  if exists (select 1 from public.identity_verifications v where v.user_id = v_app.applicant_id) then
    return query select 'verified'::text, null::timestamptz, v_in_litter;
    return;
  end if;
  if v_app.status in ('accepted', 'rejected') then
    return query select 'not_waiting'::text, null::timestamptz, v_in_litter;
    return;
  end if;
  if v_app.status <> 'sent' then
    return query select private.not_answerable(v_app), null::timestamptz, v_in_litter;
    return;
  end if;

  insert into public.application_identity_asks (application_id)
  values (p_id)
  returning application_identity_asks.asked_at into v_asked;

  insert into public.application_notices (kind, application_id, recipient_id)
  values ('identity_asked', p_id, v_app.applicant_id);

  return query select 'asked'::text, v_asked, v_in_litter;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Resolver al aprobar (R4, R5, R6)
-- ---------------------------------------------------------------------------------------------

-- Corre dentro de la aprobación. Solo las solicitudes que siguen esperando respuesta: el candado de
-- cada una ordena la aprobación con un aceptar, un rechazo o un cierre simultáneos, y el que llega
-- segundo ve el estado del primero. Cada una vuelve a figurar como nueva y le escribe a quien publicó
-- con la regla del correo de solicitud nueva, contando también las que volvieron a ser nuevas
-- después de la última visita. Devuelve el nivel de ahora de quien pidió cada una.
create function private.resolve_identity_asks(p_user uuid)
returns smallint[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.applications%rowtype;
  v_levels smallint[] := '{}';
begin
  for v_app in
    select a.*
      from public.applications a
      join public.application_identity_asks k on k.application_id = a.id
     where a.applicant_id = p_user
       and a.status = 'sent'
       and k.resolved_at is null
     order by a.id
       for update of a
  loop
    update public.application_identity_asks k
       set resolved_at = now()
     where k.application_id = v_app.id;

    insert into public.application_reviews as r (application_id, opened_at)
    values (v_app.id, null)
    on conflict (application_id) do update set opened_at = null;

    if not exists (
      select 1
        from public.applications o
        left join public.application_reviews r on r.application_id = o.id
        left join public.application_identity_asks k on k.application_id = o.id
       where o.pet_id = v_app.pet_id
         and o.id <> v_app.id
         and o.status = 'sent'
         and r.opened_at is null
         and greatest(o.sent_at, coalesce(k.resolved_at, '-infinity'::timestamptz)) > coalesce(
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
      values ('identity_verified', v_app.id, v_app.publisher_id);
    end if;

    v_levels := v_levels || private.person_level(v_app.publisher_id);
  end loop;
  return v_levels;
end;
$$;

-- La de la #63 con `asker_levels`: el nivel de quien pidió cada pedido que esta aprobación resolvió,
-- vacío si rechaza, si no había pedidos o si no se resolvió nada.
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
  asker_levels smallint[]
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
    asker_levels := private.resolve_identity_asks(v_owner);
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
  select p.code, p.name into return_code, return_name
    from public.pets p
   where p.id = v_open.return_pet_id;
  return next;
end;
$$;

-- Un pedido resuelto implica que ya se había abierto: volver a abrirla no es la primera vez y no
-- vuelve a medir las horas hasta abrirla (R5).
create or replace function public.open_application(p_publisher uuid, p_id uuid)
returns table (opened_first boolean, sent_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sent timestamptz;
  v_first boolean;
begin
  select a.sent_at into v_sent
    from public.applications a
   where a.id = p_id
     and a.publisher_id = p_publisher;
  if not found then
    return;
  end if;

  insert into public.application_reviews as r (application_id, opened_at)
  values (p_id, now())
  on conflict (application_id) do update
    set opened_at = now()
    where r.opened_at is null
  returning true into v_first;

  return query select coalesce(v_first, false) and not exists (
                        select 1
                          from public.application_identity_asks k
                         where k.application_id = p_id
                           and k.resolved_at is not null
                      ),
                      v_sent;
end;
$$;

-- La de la #65 con la misma regla que `resolve_identity_asks`: una solicitud que volvió a ser nueva
-- después de la última visita también frena el correo de solicitud nueva, que si no saldría dos
-- veces sin que quien publicó haya mirado.
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
      from public.applications a
     where a.applicant_id = p_applicant
       and a.pet_id = v_pet.id
       and a.status = 'rejected'
  ) then
    return query select 'rejected', null::uuid;
    return;
  end if;

  if (
    select count(*)
      from public.applications a
     where a.applicant_id = p_applicant
       and a.status in ('sent', 'accepted')
  ) >= private.max_active_applications() then
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

  if not exists (
    select 1
      from public.applications a
      left join public.application_reviews r on r.application_id = a.id
      left join public.application_identity_asks k on k.application_id = a.id
     where a.pet_id = v_pet.id
       and a.id <> v_id
       and a.status = 'sent'
       and r.opened_at is null
       and greatest(a.sent_at, coalesce(k.resolved_at, '-infinity'::timestamptz)) > coalesce(
         (
           select iv.seen_at
             from public.inbox_visits iv
            where iv.publisher_id = v_pet.owner_id
              and iv.pet_id = v_pet.id
         ),
         '-infinity'::timestamptz
       )
  ) then
    insert into public.application_notices (kind, application_id, recipient_id)
    values ('new_application', v_id, v_pet.owner_id);
  end if;

  return query select 'sent', v_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Lo que ve cada lado (R3, R10)
-- ---------------------------------------------------------------------------------------------

-- Suma el pedido con sus dos días y si quien solicitó tiene la identidad aprobada, que solo esconde
-- el botón: nada del estado de su pedido de verificación (FR-012).
drop function public.publisher_application(uuid);

create function public.publisher_application(p_id uuid)
returns table (
  id uuid,
  status text,
  publisher_close text,
  sent_at timestamptz,
  changed_at timestamptz,
  pet_id uuid,
  pet_code text,
  pet_name text,
  pet_sex text,
  pet_state text,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  applicant_public_id text,
  applicant_name text,
  applicant_has_photo boolean,
  applicant_department text,
  applicant_locality text,
  applicant_level smallint,
  answers jsonb,
  opened_at timestamptz,
  accepted_at timestamptz,
  rejection_reason text,
  rejection_note text,
  applicant_has_phone boolean,
  publisher_has_phone boolean,
  questions_asked integer,
  question_pending boolean,
  identity_asked_at timestamptz,
  identity_resolved_at timestamptz,
  applicant_identity_verified boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.status,
         case
           when not g.shows and a.status in ('withdrawn', 'closed') then 'unpublished'
           else private.publisher_close(a)
         end,
         a.sent_at, a.changed_at,
         case when g.shows then p.id end,
         case when g.shows then p.code end,
         coalesce(case when g.shows then p.name end, a.pet_name),
         p.sex,
         case when g.shows then private.pet_state(p.status, p.expires_at, p.taken_down_at) end,
         case when g.shows then ph.id end,
         case when g.shows then ph.owner_id end,
         case when g.shows then ph.width end,
         case when g.shows then ph.height end,
         case when g.shows then ph.thumbhash end,
         case when g.shows then pr.public_id end,
         case when g.shows then pr.display_name end,
         case when g.shows then pr.avatar_path is not null end,
         case when g.shows then pr.department end,
         case when g.shows then pr.locality end,
         case when g.shows then private.person_level(a.applicant_id) end,
         case when g.shows then a.answers end,
         r.opened_at, r.accepted_at, r.rejection_reason, r.rejection_note,
         public.identity_level_one(a.applicant_id, private.pending_ttl()),
         public.identity_level_one(a.publisher_id, private.pending_ttl()),
         (select count(*)::integer from public.application_questions q where q.application_id = a.id),
         exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         ),
         k.asked_at,
         k.resolved_at,
         case when g.shows then exists (
           select 1 from public.identity_verifications v where v.user_id = a.applicant_id
         ) end
    from public.applications a
    left join public.pets p on p.id = a.pet_id
    cross join lateral (select p.id is not null and p.taken_down_at is null as shows) g
    left join public.pet_photos ph on ph.pet_id = p.id and ph.position = 0
    left join public.profiles pr on pr.id = a.applicant_id
    left join public.application_reviews r on r.application_id = a.id
    left join public.application_identity_asks k on k.application_id = a.id
   where a.id = p_id
     and a.publisher_id = (select auth.uid());
$$;

-- Suma la marca de la fila: un pedido abierto con la solicitud esperando respuesta (FR-014).
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
  identity_asked boolean
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
         a.status = 'sent' and k.application_id is not null and k.resolved_at is null
    from public.applications a
    join public.pets p on p.id = a.pet_id
    left join public.application_reviews r on r.application_id = a.id
    left join public.application_identity_asks k on k.application_id = a.id
    left join public.profiles pr on pr.id = a.applicant_id
   where a.pet_id = p_pet
     and p.owner_id = (select auth.uid())
     and p.taken_down_at is null;
$$;

-- La de la #206 con el pedido, solo mientras la solicitud espera respuesta (FR-017): si está
-- abierto, el día de la aprobación si se resolvió y el nivel de ahora de quien publicó (FR-015).
drop function public.my_application(uuid);

create function public.my_application(p_id uuid)
returns table (
  id uuid,
  status text,
  close_reason text,
  sent_at timestamptz,
  changed_at timestamptz,
  code text,
  pet_name text,
  pet_on_view boolean,
  cover_id uuid,
  cover_owner uuid,
  cover_width smallint,
  cover_height smallint,
  cover_thumbhash text,
  publisher_name text,
  answers jsonb,
  was_accepted boolean,
  waiting_question boolean,
  adoption text,
  litter_name text,
  identity_asked boolean,
  identity_resolved_at timestamptz,
  publisher_level smallint
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.status, a.close_reason, a.sent_at, a.changed_at,
         v.code,
         coalesce(v.name, a.pet_name),
         coalesce(v.on_view, false),
         v.cover_id, v.cover_owner, v.cover_width, v.cover_height, v.cover_thumbhash,
         v.publisher_name,
         a.answers,
         coalesce(r.accepted_at is not null, false),
         a.status in ('sent', 'accepted') and exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         ),
         case when a.close_reason = 'handed_over' then private.adoption_state(a.id) end,
         coalesce(case when v.shows then private.litter_name_of(a.pet_id) end, a.litter_name),
         a.status = 'sent' and k.application_id is not null and k.resolved_at is null,
         case when a.status = 'sent' then k.resolved_at end,
         case
           when a.status = 'sent' and k.application_id is not null
             then private.person_level(a.publisher_id)
         end
    from public.applications a
    left join lateral private.application_pet(a.pet_id, a.applicant_id) v on true
    left join public.application_reviews r on r.application_id = a.id
    left join public.application_identity_asks k on k.application_id = a.id
   where a.id = p_id
     and a.applicant_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.identity_asks_drop_on_publisher_gone()
  from public, anon, authenticated;
revoke all on function public.ask_identity(uuid, uuid) from public, anon, authenticated;
revoke all on function private.resolve_identity_asks(uuid) from public, anon, authenticated;
revoke all on function public.resolve_identity_request(
  uuid, uuid, text, integer, integer, interval, text
) from public, anon, authenticated;
revoke all on function public.publisher_application(uuid) from public, anon, authenticated;
revoke all on function public.pet_applications(uuid) from public, anon, authenticated;
revoke all on function public.my_application(uuid) from public, anon, authenticated;

grant execute on function public.ask_identity(uuid, uuid) to service_role;
grant execute on function private.resolve_identity_asks(uuid) to service_role;
grant execute on function public.resolve_identity_request(
  uuid, uuid, text, integer, integer, interval, text
) to service_role;
grant execute on function public.publisher_application(uuid) to authenticated;
grant execute on function public.pet_applications(uuid) to authenticated;
grant execute on function public.my_application(uuid) to authenticated;
