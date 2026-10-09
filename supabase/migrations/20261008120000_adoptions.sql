-- A quién se entregó cada animal y el compromiso de adopción (historia #67). Una fila de
-- `adoptions` por cada vez que se marca adoptado (research R1), sin políticas: la leen funciones que
-- miran quién pregunta (R2). Marcar adoptado es `mark_pet_adopted`, que elige, cierra y adopta en una
-- transacción (R3); el contacto después de adoptar queda solo para el par (R4).

-- ---------------------------------------------------------------------------------------------
-- La tabla
-- ---------------------------------------------------------------------------------------------

create table public.adoptions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  publisher_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  application_id uuid references public.applications (id) on delete set null,
  adopter_id uuid references auth.users (id) on delete set null,
  includes_neuter boolean,
  attempt_id uuid not null,
  marked_at timestamptz not null default now(),
  adopter_accepted_at timestamptz,
  declined_at timestamptz,
  contact_cut_at timestamptz,
  ended_at timestamptz,

  constraint adoptions_kind_valid check (kind in ('site', 'outside')),
  -- De una entrega por fuera no se guarda nada de la persona (FR-061).
  constraint adoptions_outside_empty check (
    kind <> 'outside' or (
      application_id is null and adopter_id is null and includes_neuter is null
      and adopter_accepted_at is null and declined_at is null and contact_cut_at is null
    )
  ),
  constraint adoptions_site_neuter check (kind <> 'site' or includes_neuter is not null),
  constraint adoptions_accept_or_decline check (adopter_accepted_at is null or declined_at is null),
  constraint adoptions_attempt_unique unique (pet_id, attempt_id)
);

comment on table public.adoptions is
  'A quién se entregó un animal cada vez que se marcó adoptado, y las fechas del compromiso '
  '(historia #67, R1). Sin políticas: la leen funciones que eligen según quién mira (R2).';

create unique index adoptions_current_idx on public.adoptions (pet_id) where ended_at is null;
create index adoptions_application_idx on public.adoptions (application_id);
create index adoptions_adopter_idx on public.adoptions (adopter_id) where adopter_id is not null;
create index adoptions_publisher_idx on public.adoptions (publisher_id);

alter table public.adoptions enable row level security;
revoke all on public.adoptions from anon, authenticated;

-- Lo que se marcó no cambia, y cada fecha pasa de vacía a un valor una sola vez. La solicitud y
-- quien adoptó solo se vacían, por el borrado de su cuenta (FR-063).
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
     or (old.ended_at is not null and new.ended_at is distinct from old.ended_at) then
    raise exception using errcode = 'P0001', message = 'adoption_final';
  end if;
  return new;
end;
$$;

create trigger adoptions_forward_only
  before update on public.adoptions
  for each row execute function private.adoptions_forward_only();

-- ---------------------------------------------------------------------------------------------
-- La solicitud elegida y los correos nuevos
-- ---------------------------------------------------------------------------------------------

alter table public.applications drop constraint applications_close_reason_valid;
alter table public.applications add constraint applications_close_reason_valid check (
  close_reason in ('adopted', 'unpublished', 'not_receiving', 'you_blocked', 'suspended', 'handed_over')
);

-- La de #65, con una excepción más: «Yo no adopté» pasa la elegida a «encontró hogar» (R5).
create or replace function private.applications_forward_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('sent', 'accepted') then
    if old.status = 'accepted' and new.status = 'sent' then
      raise exception using errcode = 'P0001', message = 'application_final';
    end if;
    return new;
  end if;
  if (new.status is distinct from old.status
      or new.close_reason is distinct from old.close_reason)
     and not (old.close_reason = 'not_receiving'
              and new.status = 'closed'
              and new.close_reason = 'you_blocked')
     and not (old.close_reason = 'handed_over'
              and new.status = 'closed'
              and new.close_reason = 'adopted') then
    raise exception using errcode = 'P0001', message = 'application_final';
  end if;
  return new;
end;
$$;

alter table public.application_notices drop constraint application_notices_kind_valid;
alter table public.application_notices add constraint application_notices_kind_valid check (
  kind in (
    'new_application', 'question_answered', 'accepted', 'rejected', 'question_asked',
    'closed_adopted', 'closed_unpublished', 'adoption_marked', 'commitment_accepted',
    'adoption_declined'
  )
);

-- Del lado del publicador, la elegida es `handed_over` (FR-042).
create or replace function private.publisher_close(p_app public.applications)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when p_app.status = 'withdrawn' then 'gone'
           when p_app.status <> 'closed' then null
           when p_app.close_reason in ('adopted', 'unpublished', 'handed_over') then p_app.close_reason
           when p_app.close_reason in ('not_receiving', 'you_blocked') and exists (
             select 1
               from public.blocks b
              where b.blocker_id = p_app.publisher_id
                and b.blocked_id = p_app.applicant_id
           ) then 'you_blocked'
           else 'gone'
         end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Ayudas
-- ---------------------------------------------------------------------------------------------

-- Los estados desde los que se marca adoptado, los de #59.
create or replace function private.pet_can_hand_over(p_state text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_state in ('available', 'in_process', 'paused', 'expired');
$$;

-- El estado de la adopción de una elegida, para Mi solicitud y Mis solicitudes: null si no es la
-- elegida o dijo «Yo no adopté».
create or replace function private.adoption_state(p_application uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when d.ended_at is not null then 'ended'
           when d.adopter_accepted_at is not null then 'accepted'
           else 'pending'
         end
    from public.adoptions d
   where d.application_id = p_application
     and d.declined_at is null
   order by d.marked_at desc
   limit 1;
$$;

-- ---------------------------------------------------------------------------------------------
-- Las lecturas (R2): con la sesión; lo ajeno, cero filas (FR-062)
-- ---------------------------------------------------------------------------------------------

-- El animal de «¿A quién se lo diste?», si es de quien mira; lo que el compromiso necesita.
create or replace function public.handover_pet(p_pet uuid)
returns table (
  pet_id uuid,
  name text,
  sex text,
  code text,
  state text,
  is_neutered boolean,
  publisher_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.sex, p.code,
         private.pet_state(p.status, p.expires_at, p.taken_down_at),
         p.is_neutered,
         pr.display_name
    from public.pets p
    left join public.profiles pr on pr.id = p.owner_id
   where p.id = p_pet
     and p.owner_id = (select auth.uid());
$$;

-- Las aceptadas de un animal suyo que se puede marcar adoptado, la más vieja primero (FR-001).
create or replace function public.handover_candidates(p_pet uuid)
returns table (
  application_id uuid,
  applicant_public_id text,
  applicant_name text,
  applicant_has_photo boolean,
  applicant_level smallint,
  accepted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, pr.public_id, pr.display_name, pr.avatar_path is not null,
         private.person_level(a.applicant_id),
         r.accepted_at
    from public.applications a
    join public.pets p on p.id = a.pet_id
    join public.profiles pr on pr.id = a.applicant_id
    left join public.application_reviews r on r.application_id = a.id
   where a.pet_id = p_pet
     and a.status = 'accepted'
     and p.owner_id = (select auth.uid())
     and private.pet_can_hand_over(private.pet_state(p.status, p.expires_at, p.taken_down_at))
   order by r.accepted_at, a.sent_at, a.id;
$$;

-- Lo que Mis animales dice de cada adoptado suyo (FR-040): a quién, si dijo que no y el compromiso.
create or replace function public.my_pet_adoptions()
returns table (
  pet_id uuid,
  kind text,
  adopter_name text,
  declined boolean,
  adopter_accepted_at timestamptz,
  marked_at timestamptz,
  ends_person boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.pet_id, d.kind, pr.display_name, d.declined_at is not null, d.adopter_accepted_at,
         d.marked_at,
         d.kind = 'site' and d.adopter_id is not null and d.declined_at is null
    from public.adoptions d
    join public.pets p on p.id = d.pet_id
    left join public.profiles pr on pr.id = d.adopter_id
   where p.owner_id = (select auth.uid())
     and d.ended_at is null;
$$;

-- La adopción de una solicitud, solo a las dos personas; quien dijo «Yo no adopté» ya no la lee
-- (FR-043, FR-062). Los nombres de hoy (FR-011).
create or replace function public.adoption_of(p_application uuid)
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
  contact_cut boolean
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
         d.contact_cut_at is not null
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

drop function public.my_applications();

-- La de #65, con el estado de la adopción de la elegida.
create or replace function public.my_applications()
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
  was_accepted boolean,
  waiting_question boolean,
  adoption text
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
         coalesce(r.accepted_at is not null, false),
         a.status in ('sent', 'accepted') and exists (
           select 1 from public.application_questions q
            where q.application_id = a.id and q.answer is null
         ),
         case when a.close_reason = 'handed_over' then private.adoption_state(a.id) end
    from public.applications a
    left join lateral private.application_pet(a.pet_id, a.applicant_id) v on true
    left join public.application_reviews r on r.application_id = a.id
   where a.applicant_id = (select auth.uid())
   order by a.status in ('sent', 'accepted') desc, a.sent_at desc, a.id;
$$;

drop function public.my_application(uuid);

create or replace function public.my_application(p_id uuid)
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
  adoption text
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
         case when a.close_reason = 'handed_over' then private.adoption_state(a.id) end
    from public.applications a
    left join lateral private.application_pet(a.pet_id, a.applicant_id) v on true
    left join public.application_reviews r on r.application_id = a.id
   where a.id = p_id
     and a.applicant_id = (select auth.uid());
$$;

-- El contacto (R4, FR-030): con la solicitud aceptada, o la elegida mientras su adopción sigue en
-- curso, sin «Yo no adopté» y sin el corte. Las aceptadas no elegidas de un adoptado ya no lo ven,
-- que es el cambio a #65. El corte es una marca que no se borra: desbloquear o reactivar no lo
-- vuelve a mostrar (FR-032).
create or replace function public.application_contact(p_id uuid)
returns table (name text, phone text, side text, viewer_name text, pet_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.display_name,
         case
           when public.identity_level_one(o.other_id, private.pending_ttl()) then ph.verified_number
         end,
         o.side,
         me.display_name,
         coalesce(p.name, a.pet_name)
    from public.applications a
    join public.application_reviews r on r.application_id = a.id
    cross join lateral (
      select case
               when a.applicant_id = (select auth.uid()) then a.publisher_id
               when a.publisher_id = (select auth.uid()) then a.applicant_id
             end as other_id,
             case
               when a.applicant_id = (select auth.uid()) then 'applicant'
               else 'publisher'
             end as side
    ) o
    join public.profiles pr on pr.id = o.other_id
    left join public.profiles me on me.id = (select auth.uid())
    left join public.phones ph on ph.user_id = o.other_id
    left join public.pets p on p.id = a.pet_id
   where a.id = p_id
     and r.accepted_at is not null
     and (
       a.status = 'accepted'
       or (
         a.status = 'closed'
         and a.close_reason = 'handed_over'
         and exists (
           select 1
             from public.adoptions d
            where d.application_id = a.id
              and d.declined_at is null
              and d.ended_at is null
              and d.contact_cut_at is null
         )
       )
     )
     and not exists (
       select 1
         from public.blocks b
        where (b.blocker_id = a.applicant_id and b.blocked_id = a.publisher_id)
           or (b.blocker_id = a.publisher_id and b.blocked_id = a.applicant_id)
     )
     and not private.is_suspended(a.applicant_id)
     and not private.is_suspended(a.publisher_id);
$$;

-- ---------------------------------------------------------------------------------------------
-- Marcar adoptado (R3)
-- ---------------------------------------------------------------------------------------------

-- Sin `p_application`, por fuera del sitio. Elegir, cerrar y adoptar en una transacción, con el candado de la cuenta y el del animal: dos
-- pestañas o un retiro mientras se elige se ordenan, y gana la primera (FR-004, Edge Cases).
--   done                   quedó adoptado; `detail` es el nombre de la elegida
--   already                ese intento ya marcó (doble toque o reintento)
--   changed                el animal ya no se puede marcar: adoptado, dado de baja
--   gone · you_blocked     la elegida se retiró, se bloquearon o se suspendió una cuenta (FR-042)
--   revoked                el publicador la dejó sin efecto
--   not_found              el animal o la solicitud no existen, no son suyos o no fue aceptada
create or replace function public.mark_pet_adopted(
  p_owner uuid,
  p_pet uuid,
  p_attempt uuid,
  p_application uuid default null
)
returns table (
  outcome text,
  detail text,
  code text,
  name text,
  sex text,
  from_state text,
  published_at timestamptz,
  accepted_at timestamptz,
  accepted_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet public.pets%rowtype;
  v_from text;
  v_app public.applications%rowtype;
  v_accepted timestamptz;
  v_count integer;
  v_name text;
  v_done public.adoptions%rowtype;
begin
  perform public.lock_phone_account(p_owner);

  select * into v_pet from public.pets p where p.id = p_pet and p.owner_id = p_owner for update;
  if not found then
    return query select 'not_found', null::text, null::text, null::text, null::text, null::text,
                        null::timestamptz, null::timestamptz, 0;
    return;
  end if;

  v_from := private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at);

  select * into v_done from public.adoptions d where d.pet_id = p_pet and d.attempt_id = p_attempt;
  if found then
    return query
      select 'already',
             (select pr.display_name from public.profiles pr where pr.id = v_done.adopter_id),
             v_pet.code, v_pet.name, v_pet.sex, v_from, v_pet.published_at, null::timestamptz, 0;
    return;
  end if;

  if not private.pet_can_hand_over(v_from) then
    return query select 'changed', null::text, v_pet.code, v_pet.name, v_pet.sex, v_from,
                        v_pet.published_at, null::timestamptz, 0;
    return;
  end if;

  select count(*)::integer into v_count
    from public.applications a
   where a.pet_id = p_pet
     and a.status = 'accepted';

  if p_application is not null then
    select * into v_app
      from public.applications a
     where a.id = p_application
       and a.pet_id = p_pet
       and a.publisher_id = p_owner
       for update;
    select pr.display_name into v_name from public.profiles pr where pr.id = v_app.applicant_id;
    select r.accepted_at into v_accepted
      from public.application_reviews r
     where r.application_id = v_app.id;

    if v_app.id is null or v_app.status = 'sent' or v_accepted is null then
      return query select 'not_found', null::text, v_pet.code, v_pet.name, v_pet.sex, v_from,
                          v_pet.published_at, null::timestamptz, v_count;
      return;
    end if;
    if v_app.status <> 'accepted' then
      return query
        select case
                 when v_app.status = 'rejected' then 'revoked'
                 when private.not_answerable(v_app) = 'closed' then 'changed'
                 else private.not_answerable(v_app)
               end,
               v_name, v_pet.code, v_pet.name, v_pet.sex, v_from, v_pet.published_at,
               null::timestamptz, v_count;
      return;
    end if;

    insert into public.adoptions (
      pet_id, publisher_id, kind, application_id, adopter_id, includes_neuter, attempt_id
    )
    values (p_pet, p_owner, 'site', v_app.id, v_app.applicant_id, v_pet.is_neutered is not true, p_attempt);

    update public.applications a
       set status = 'closed', close_reason = 'handed_over', changed_at = now(), pet_name = v_pet.name
     where a.id = v_app.id;

    insert into public.application_notices (kind, application_id, recipient_id)
    values ('adoption_marked', v_app.id, v_app.applicant_id);
  else
    insert into public.adoptions (pet_id, publisher_id, kind, attempt_id)
    values (p_pet, p_owner, 'outside', p_attempt);
  end if;

  -- Como lo hacía `change_pet_status`: el disparador de #63/#65 cierra las otras como que encontró
  -- hogar y escribe sus correos; la elegida ya está cerrada y no recibe el suyo (FR-050).
  update public.pets p
     set status = 'adopted',
         status_changed_at = now(),
         expires_at = null
   where p.id = p_pet;

  return query select 'done', v_name, v_pet.code, v_pet.name, v_pet.sex, v_from,
                      v_pet.published_at, v_accepted, v_count;
end;
$$;

-- `change_pet_status` ya no adopta: todo pasa por `mark_pet_adopted`, que exige elegir (R3). Volver
-- a publicar un adoptado termina su adopción en la misma transacción (R6); `ended_marked_at` es el
-- día en que se marcó la que terminó, solo si era a una persona que no dijo «Yo no adopté», para
-- medir cuánto duró. Suma una columna: se vuelve a crear.
drop function public.change_pet_status(uuid, uuid, text, interval);
create function public.change_pet_status(
  p_owner uuid,
  p_pet uuid,
  p_action text,
  p_pending_ttl interval
)
returns table (
  outcome text,
  code text,
  name text,
  sex text,
  from_state text,
  state text,
  expires_at timestamptz,
  published_at timestamptz,
  ended_marked_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet public.pets%rowtype;
  v_from text;
  v_target text;
  v_fresh boolean := false;
  v_republish boolean := false;
  v_ended timestamptz;
begin
  if p_action not in (
    'mark_in_process', 'mark_available', 'pause', 'resume', 'mark_adopted', 'renew', 'republish'
  ) then
    raise exception using errcode = 'P0001', message = 'invalid_action';
  end if;

  perform public.lock_phone_account(p_owner);

  select * into v_pet from public.pets p where p.id = p_pet and p.owner_id = p_owner for update;
  if not found then
    return query select 'not_found', null::text, null::text, null::text, null::text, null::text,
                        null::timestamptz, null::timestamptz, null::timestamptz;
    return;
  end if;

  v_from := private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at);

  if v_from = 'taken_down' then
    return query select 'taken_down', v_pet.code, v_pet.name, v_pet.sex, v_from, v_from,
                        v_pet.expires_at, v_pet.published_at, null::timestamptz;
    return;
  end if;

  if p_action = 'mark_adopted' then
    return query select 'changed', v_pet.code, v_pet.name, v_pet.sex, v_from, v_from,
                        v_pet.expires_at, v_pet.published_at, null::timestamptz;
    return;
  end if;

  case
    when p_action = 'mark_in_process' and v_from = 'available' then v_target := 'in_process';
    when p_action = 'mark_available' and v_from = 'in_process' then v_target := 'available';
    when p_action = 'pause' and v_from in ('available', 'in_process') then v_target := 'paused';
    when p_action = 'resume' and v_from = 'paused' then
      v_target := 'available';
      v_fresh := true;
    when p_action = 'renew' and v_from in ('available', 'in_process') then
      v_target := v_pet.status;
      v_fresh := true;
    when p_action = 'republish' and v_from in ('adopted', 'expired') then
      v_target := 'available';
      v_fresh := true;
      v_republish := true;
    else
      v_target := null;
  end case;

  if v_target is null then
    return query select
      case
        when (p_action, v_from) in (
          ('mark_in_process', 'in_process'), ('mark_available', 'available'), ('pause', 'paused')
        ) then 'already'
        else 'changed'
      end,
      v_pet.code, v_pet.name, v_pet.sex, v_from, v_from, v_pet.expires_at, v_pet.published_at,
      null::timestamptz;
    return;
  end if;

  if v_fresh and not public.identity_level_one(p_owner, p_pending_ttl) then
    return query select 'needs_verification', v_pet.code, v_pet.name, v_pet.sex, v_from, v_from,
                        v_pet.expires_at, v_pet.published_at, null::timestamptz;
    return;
  end if;

  update public.pets p
     set status = v_target,
         status_changed_at = now(),
         expires_at = case
                        when v_target not in ('available', 'in_process') then null
                        when v_fresh then now() + private.pet_lifetime()
                        else p.expires_at
                      end,
         reminder_sent_at = case when v_fresh then null else p.reminder_sent_at end,
         expiry_counted_at = case when v_fresh then null else p.expiry_counted_at end,
         published_at = case when v_republish then now() else p.published_at end
   where p.id = p_pet
  returning * into v_pet;

  if v_republish then
    update public.adoptions d
       set ended_at = now()
     where d.pet_id = p_pet
       and d.ended_at is null
    returning case
                when d.kind = 'site' and d.adopter_id is not null and d.declined_at is null
                  then d.marked_at
              end into v_ended;
  end if;

  return query select 'done', v_pet.code, v_pet.name, v_pet.sex, v_from,
                      private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at),
                      v_pet.expires_at, v_pet.published_at, v_ended;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Aceptar el compromiso (R5)
-- ---------------------------------------------------------------------------------------------

-- Quien adoptó acepta su compromiso, con la fila tomada: el doble toque y el reintento que ya había
-- llegado hacen una sola cosa y escriben un solo par de correos (FR-055).
--   done          quedó aceptado; un correo para cada una de las dos (FR-051)
--   already       ya estaba aceptado
--   suspended     su cuenta está suspendida (FR-034)
--   closed        la adopción terminó, se deshizo o se cortó el contacto (FR-013)
--   not_found     esa solicitud no tiene una adopción a su nombre
create or replace function public.accept_commitment(p_adopter uuid, p_application uuid)
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
  if v_adoption.adopter_accepted_at is not null then
    return query select 'already', v_adoption.marked_at;
    return;
  end if;
  if private.is_suspended(p_adopter) then
    return query select 'suspended', v_adoption.marked_at;
    return;
  end if;
  if v_adoption.declined_at is not null
     or v_adoption.ended_at is not null
     or v_adoption.contact_cut_at is not null then
    return query select 'closed', v_adoption.marked_at;
    return;
  end if;

  update public.adoptions d set adopter_accepted_at = now() where d.id = v_adoption.id;

  insert into public.application_notices (kind, application_id, recipient_id)
  values ('commitment_accepted', p_application, v_adoption.adopter_id),
         ('commitment_accepted', p_application, v_adoption.publisher_id);

  return query select 'done', v_adoption.marked_at;
end;
$$;

-- «Yo no adopté» (R5), con la fila tomada como al aceptar: la elegida por error deshace la adopción
-- una sola vez y quien lo dio recibe un solo correo (FR-055). El animal sigue adoptado; la solicitud
-- pasa a «encontró hogar», con lo que el contacto deja de leerse para las dos (FR-021).
--   done          quedó deshecha; un correo a quien lo dio (FR-052)
--   already       ya lo había dicho
--   suspended     su cuenta está suspendida (FR-034)
--   closed        ya aceptó el compromiso, la adopción terminó o se cortó el contacto (FR-020)
--   not_found     esa solicitud no tiene una adopción a su nombre
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

-- El correo del compromiso (R7), para una de las dos personas: de qué lado está, los nombres de hoy
-- (FR-011), las fechas y la portada del animal mientras se pueda mostrar. Sin teléfono ni correo de
-- nadie (FR-054). Cero filas si quien recibe no es una de las dos.
create or replace function public.commitment_for_email(p_application uuid, p_recipient uuid)
returns table (
  side text,
  pet_name text,
  pet_sex text,
  pet_code text,
  cover_id uuid,
  includes_neuter boolean,
  publisher_name text,
  adopter_name text,
  marked_at timestamptz,
  adopter_accepted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select case when d.publisher_id = p_recipient then 'publisher' else 'adopter' end,
         coalesce(p.name, a.pet_name),
         p.sex,
         v.code,
         v.cover_id,
         d.includes_neuter,
         pp.display_name,
         pa.display_name,
         d.marked_at,
         d.adopter_accepted_at
    from public.adoptions d
    join public.applications a on a.id = d.application_id
    left join public.pets p on p.id = d.pet_id
    left join lateral private.application_pet(d.pet_id, p_recipient) v on true
    left join public.profiles pp on pp.id = d.publisher_id
    left join public.profiles pa on pa.id = d.adopter_id
   where d.application_id = p_application
     and p_recipient in (d.publisher_id, d.adopter_id)
   order by d.marked_at desc
   limit 1;
$$;

-- ---------------------------------------------------------------------------------------------
-- El corte del contacto (R4): bloqueo y suspensión de #63, con la marca que no vuelve
-- ---------------------------------------------------------------------------------------------

-- Como en #65, más el corte de las adopciones en curso entre las dos, en las dos direcciones: el
-- teléfono deja de verse y el compromiso queda como estaba; desbloquear no lo borra (FR-032).
create or replace function private.applications_close_on_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.applications a
     set status = 'closed',
         close_reason = 'not_receiving',
         changed_at = now(),
         pet_name = coalesce((select p.name from public.pets p where p.id = a.pet_id), a.pet_name)
   where a.applicant_id = new.blocked_id
     and a.publisher_id = new.blocker_id
     and a.status in ('sent', 'accepted');

  update public.applications a
     set status = 'closed',
         close_reason = 'you_blocked',
         changed_at = now(),
         pet_name = coalesce((select p.name from public.pets p where p.id = a.pet_id), a.pet_name)
   where a.applicant_id = new.blocker_id
     and a.publisher_id = new.blocked_id
     and a.status in ('sent', 'accepted');

  update public.applications a
     set close_reason = 'you_blocked'
   where a.applicant_id = new.blocker_id
     and a.publisher_id = new.blocked_id
     and a.status = 'closed'
     and a.close_reason = 'not_receiving';

  update public.adoptions d
     set contact_cut_at = now()
   where d.ended_at is null
     and d.declined_at is null
     and d.contact_cut_at is null
     and (
       (d.publisher_id = new.blocker_id and d.adopter_id = new.blocked_id)
       or (d.publisher_id = new.blocked_id and d.adopter_id = new.blocker_id)
     );
  return null;
end;
$$;

-- Como en #65, más el corte de las adopciones en curso de la persona, de los dos lados; reactivar
-- la cuenta no lo borra (FR-032).
create or replace function private.applications_close_on_suspension()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.applications a
     set status = 'closed',
         close_reason = 'suspended',
         changed_at = now(),
         pet_name = coalesce((select p.name from public.pets p where p.id = a.pet_id), a.pet_name)
   where a.applicant_id = new.user_id
     and a.status in ('sent', 'accepted');

  update public.applications a
     set status = 'closed',
         close_reason = 'unpublished',
         changed_at = now(),
         pet_name = coalesce((select p.name from public.pets p where p.id = a.pet_id), a.pet_name)
   where a.publisher_id = new.user_id
     and a.status in ('sent', 'accepted');

  update public.adoptions d
     set contact_cut_at = now()
   where d.ended_at is null
     and d.declined_at is null
     and d.contact_cut_at is null
     and new.user_id in (d.publisher_id, d.adopter_id);
  return null;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.adoptions_forward_only() from public, anon, authenticated;
revoke all on function private.pet_can_hand_over(text) from public, anon, authenticated;
revoke all on function private.adoption_state(uuid) from public, anon, authenticated;
revoke all on function private.publisher_close(public.applications) from public, anon, authenticated;

revoke all on function public.handover_pet(uuid) from public, anon, authenticated;
revoke all on function public.handover_candidates(uuid) from public, anon, authenticated;
revoke all on function public.my_pet_adoptions() from public, anon, authenticated;
revoke all on function public.adoption_of(uuid) from public, anon, authenticated;
revoke all on function public.my_applications() from public, anon, authenticated;
revoke all on function public.my_application(uuid) from public, anon, authenticated;
revoke all on function public.application_contact(uuid) from public, anon, authenticated;
revoke all on function public.mark_pet_adopted(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.change_pet_status(uuid, uuid, text, interval)
  from public, anon, authenticated;
revoke all on function public.accept_commitment(uuid, uuid) from public, anon, authenticated;
revoke all on function public.decline_adoption(uuid, uuid) from public, anon, authenticated;
revoke all on function public.commitment_for_email(uuid, uuid) from public, anon, authenticated;

grant execute on function public.handover_pet(uuid) to authenticated;
grant execute on function public.handover_candidates(uuid) to authenticated;
grant execute on function public.my_pet_adoptions() to authenticated;
grant execute on function public.adoption_of(uuid) to authenticated;
grant execute on function public.my_applications() to authenticated;
grant execute on function public.my_application(uuid) to authenticated;
grant execute on function public.application_contact(uuid) to authenticated;
grant execute on function public.mark_pet_adopted(uuid, uuid, uuid, uuid) to service_role;
grant execute on function public.change_pet_status(uuid, uuid, text, interval) to service_role;
grant execute on function public.accept_commitment(uuid, uuid) to service_role;
grant execute on function public.decline_adoption(uuid, uuid) to service_role;
grant execute on function public.commitment_for_email(uuid, uuid) to service_role;
