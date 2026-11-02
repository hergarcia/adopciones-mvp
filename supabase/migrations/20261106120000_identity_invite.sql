-- La invitación a verificar la identidad en «Mis animales» (historia #281): el día de «Ahora no»,
-- el origen `my_pets` del pedido de verificación y el origen `invited` de la pregunta de por qué
-- se va (research R1, R4, R6).

-- ---------------------------------------------------------------------------------------------
-- «Ahora no» de la invitación (R1)
-- ---------------------------------------------------------------------------------------------

create table public.identity_invite_dismissals (
  person_id uuid primary key references auth.users (id) on delete cascade,
  dismissed_on date not null default ((now() at time zone 'America/Montevideo')::date)
);

comment on table public.identity_invite_dismissals is
  'Quién tocó «Ahora no» en la invitación de «Mis animales» y el día de Uruguay, nada más (historia '
  '#281, FR-022). Sin políticas: la leen solo dismiss_identity_invite e identity_invite_dismissed, '
  'con auth.uid(); quien administra no la ve (FR-021). Se borra con la cuenta.';

alter table public.identity_invite_dismissals enable row level security;
revoke all on public.identity_invite_dismissals from anon, authenticated;

-- La clave primaria deja un solo día aunque se toque dos veces o en dos pestañas (FR-017): el
-- segundo insert espera al primero y después no inserta.
create function public.dismiss_identity_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid := (select auth.uid());
begin
  if v_person is null then
    return 'not_signed_in';
  end if;

  insert into public.identity_invite_dismissals (person_id)
  values (v_person)
  on conflict (person_id) do nothing;
  if found then
    return 'dismissed';
  end if;
  return 'already';
end;
$$;

create function public.identity_invite_dismissed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.identity_invite_dismissals d where d.person_id = (select auth.uid())
  );
$$;

revoke all on function public.dismiss_identity_invite() from public, anon, authenticated;
revoke all on function public.identity_invite_dismissed() from public, anon, authenticated;

grant execute on function public.dismiss_identity_invite() to authenticated;
grant execute on function public.identity_invite_dismissed() to authenticated;

-- ---------------------------------------------------------------------------------------------
-- El origen del pedido de verificación (R4)
-- ---------------------------------------------------------------------------------------------

alter table public.identity_requests
  drop constraint identity_requests_origin_valid;
alter table public.identity_requests
  add constraint identity_requests_origin_valid
  check (origin in ('profile', 'my_pets'));

-- ---------------------------------------------------------------------------------------------
-- El origen de la pregunta de por qué se va (R6)
-- ---------------------------------------------------------------------------------------------

alter table public.verification_exit_tickets
  drop constraint verification_exit_tickets_origin_valid;
alter table public.verification_exit_tickets
  add constraint verification_exit_tickets_origin_valid
  check (origin in ('publish', 'apply', 'self', 'asked', 'invited'));

alter table public.verification_exit_answers
  drop constraint verification_exit_answers_origin_valid;
alter table public.verification_exit_answers
  add constraint verification_exit_answers_origin_valid
  check (origin in ('publish', 'apply', 'self', 'asked', 'invited'));

alter table public.verification_exit_counts
  drop constraint verification_exit_counts_origin_valid;
alter table public.verification_exit_counts
  add constraint verification_exit_counts_origin_valid
  check (origin in ('publish', 'apply', 'self', 'asked', 'invited'));

insert into public.verification_exit_counts (level, origin)
values ('phone', 'invited'), ('identity', 'invited');

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
  if p_origin is null or p_origin not in ('publish', 'apply', 'self', 'asked', 'invited')
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

-- El orden completo: con dos orígenes fuera de la lista, `array_position` nulo dejaba su orden
-- librado a la base.
create or replace function public.admin_verification_exit_summary()
returns table (
  level text,
  origin text,
  asked integer,
  skipped integer,
  option text,
  chosen integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.level,
         c.origin,
         c.asked,
         c.skipped,
         o.option,
         (select count(*)::integer from public.verification_exit_answers a
           where a.level = c.level and a.origin = c.origin and a.option = o.option)
    from public.verification_exit_counts c
    join (
      values ('phone', 'no_number', 1), ('phone', 'no_code', 2), ('phone', 'later', 3),
             ('phone', 'groups', 4), ('phone', 'other', 5),
             ('identity', 'no_id_photos', 1), ('identity', 'later', 2),
             ('identity', 'too_much', 3), ('identity', 'groups', 4), ('identity', 'other', 5)
    ) as o (level, option, position) on o.level = c.level
   where private.is_admin()
   order by array_position(array['phone', 'identity'], c.level),
            array_position(array['publish', 'apply', 'self', 'asked', 'invited'], c.origin),
            o.position;
$$;
