-- El aval entre personas y el perfil público (historia #12). Las tablas siguen cerradas: lo ajeno
-- sale solo por `public_profile`, que recorta en la base exactamente lo que FR-005 deja ver, y cada
-- escritura de un aval pasa por una función con el candado del par. «Cuenta» (las dos partes con
-- nivel 2) no se guarda: se calcula al leer con `private.has_level_two`, así perder o recuperar el
-- nivel no escribe nada (FR-002). El TTL del número a medias llega como parámetro desde
-- `lib/verification/rules.ts`, que sigue siendo su única fuente.

-- 128 bits al azar en base64url: no se adivina ni se recorre, no depende del nombre y se va con la
-- cuenta (FR-008). Las filas que ya existen reciben el suyo al agregar la columna.
alter table public.profiles
  add column public_id text not null
    default translate(rtrim(encode(extensions.gen_random_bytes(16), 'base64'), '='), '+/', '-_'),
  add constraint profiles_public_id_key unique (public_id),
  add constraint profiles_public_id_format check (public_id ~ '^[A-Za-z0-9_-]{22}$');

comment on column public.profiles.public_id is
  'El id del enlace al perfil público. Nadie lo elige ni lo cambia: el id de la cuenta nunca '
  'circula en una URL (research R1 de la historia #12).';

-- `authenticated` tenía `insert` y `update` sobre la tabla entera (el default de Supabase), y
-- revocar una columna no le quita nada a un permiso de tabla: se revoca el de tabla y se otorgan
-- las columnas que el formulario escribe, sin `public_id`. `id` va en el `update` porque el
-- `upsert` de PostgREST escribe `set id = excluded.id`; `profiles_update_own` ya lo ata a la sesión.
revoke insert, update on public.profiles from authenticated;
grant insert (id, display_name, department, locality, is_rescuer, avatar_path),
  update (id, display_name, department, locality, is_rescuer, avatar_path)
  on public.profiles to authenticated;

create table public.vouches (
  voucher_id uuid not null references auth.users (id) on delete cascade,
  vouchee_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (voucher_id, vouchee_id),
  constraint vouches_not_self check (voucher_id <> vouchee_id)
);

comment on table public.vouches is
  'Los avales vigentes: la fila existe mientras nadie lo retire ni lo quite. Si cuenta se calcula '
  'al leer (FR-002). Nadie la lee desde el cliente: una policy de las dos partes le daría a cada '
  'una el id de cuenta de la otra.';

create index vouches_vouchee_idx on public.vouches (vouchee_id, created_at desc);

alter table public.vouches enable row level security;
revoke all on public.vouches from anon, authenticated;

create table public.vouch_blocks (
  voucher_id uuid not null references auth.users (id) on delete cascade,
  vouchee_id uuid not null references auth.users (id) on delete cascade,

  primary key (voucher_id, vouchee_id),
  constraint vouch_blocks_not_self check (voucher_id <> vouchee_id)
);

comment on table public.vouch_blocks is
  'Las quitas: quién había dado el aval y quién lo quitó, sin fecha (FR-018). Se guarda aunque el '
  'aval ya no estuviera, así la decisión de quien quita no depende de quién llegó primero.';

create index vouch_blocks_vouchee_idx on public.vouch_blocks (vouchee_id);

alter table public.vouch_blocks enable row level security;
revoke all on public.vouch_blocks from anon, authenticated;

-- La definición de nivel 2 en SQL, la única: nivel 1 y la identidad verificada. La escalera entera
-- (0 a 3) vive en `lib/verification/level.ts`.
create or replace function private.has_level_two(p_user uuid, p_pending_ttl interval)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.identity_level_one(p_user, p_pending_ttl)
     and exists (select 1 from public.identity_verifications v where v.user_id = p_user);
$$;

-- Lo que cualquiera ve de otra persona, y nada más (FR-005). Cero filas para un id que no existe,
-- una cuenta borrada o un perfil sin completar: los tres son «no hay fila» (FR-007). Los meses se
-- truncan acá, en hora de Uruguay, para que el día exacto no salga de la base (R8). La identidad
-- sale solo con nivel 1, así el motivo de no tener nivel no se infiere (FR-006).
create or replace function public.public_profile(p_public_id text, p_pending_ttl interval)
returns table (
  public_id text,
  display_name text,
  department text,
  locality text,
  is_rescuer boolean,
  has_photo boolean,
  member_since date,
  level_one boolean,
  identity_since date,
  vouchers jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.public_id,
    p.display_name,
    p.department,
    p.locality,
    p.is_rescuer,
    p.avatar_path is not null,
    date_trunc('month', p.created_at at time zone 'America/Montevideo')::date,
    l.level_one,
    case when l.level_one then date_trunc('month', v.verified_on)::date end,
    case
      when l.level_one and v.user_id is not null then coalesce(
        (
          select jsonb_agg(
                   jsonb_build_object('public_id', o.public_id, 'display_name', o.display_name)
                   order by x.created_at desc
                 )
            from public.vouches x
            join public.profiles o on o.id = x.voucher_id
           where x.vouchee_id = p.id
             and private.has_level_two(x.voucher_id, p_pending_ttl)
        ),
        '[]'::jsonb
      )
      else '[]'::jsonb
    end
  from public.profiles p
  cross join lateral (select public.identity_level_one(p.id, p_pending_ttl) as level_one) l
  left join public.identity_verifications v on v.user_id = p.id
  where p.public_id = p_public_id;
$$;

-- La ruta de la foto de un perfil completo, para la ruta que la sirve sin el id de la cuenta (R7).
create or replace function public.avatar_path_for(p_public_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.avatar_path from public.profiles p where p.public_id = p_public_id;
$$;

-- La relación entre quien mira y la persona mirada, para el lugar de avalar (R6). Cero filas si el
-- perfil no existe.
create or replace function public.vouch_standing(p_viewer uuid, p_target_public_id text)
returns table (viewer_vouches boolean, target_vouches_viewer boolean, blocked_by_target boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.vouches x where x.voucher_id = p_viewer and x.vouchee_id = t.id
    ),
    exists (
      select 1 from public.vouches x where x.voucher_id = t.id and x.vouchee_id = p_viewer
    ),
    exists (
      select 1 from public.vouch_blocks b where b.voucher_id = p_viewer and b.vouchee_id = t.id
    )
  from public.profiles t
  where t.public_id = p_target_public_id;
$$;

-- Las filas de «Mis avales» (FR-025): el día del aval, que es de las dos partes, y a quién le falta
-- el nivel 2, nunca el motivo.
create or replace function public.my_vouches(p_user uuid, p_pending_ttl interval)
returns table (
  direction text,
  other_public_id text,
  other_display_name text,
  other_has_photo boolean,
  given_on date,
  mine_lacks_level_two boolean,
  other_lacks_level_two boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select not private.has_level_two(p_user, p_pending_ttl) as lacks),
  pairs as (
    select 'given' as direction, x.vouchee_id as other_id, x.created_at
      from public.vouches x
     where x.voucher_id = p_user
    union all
    select 'received', x.voucher_id, x.created_at
      from public.vouches x
     where x.vouchee_id = p_user
  )
  select
    r.direction,
    o.public_id,
    o.display_name,
    o.avatar_path is not null,
    (r.created_at at time zone 'America/Montevideo')::date,
    me.lacks,
    not private.has_level_two(r.other_id, p_pending_ttl)
  from pairs r
  join public.profiles o on o.id = r.other_id
  cross join me
  order by r.direction, r.created_at desc;
$$;

-- Los dos candados de un aval, siempre en este orden: el del par ordenado, para que «A avala a B» y
-- «B avala a A» a la vez se hagan de a uno (SC-004), y el de quien recibe, para que dos personas que
-- avalan a la misma a la vez no vean las dos «ningún aval contaba» (R4).
create or replace function private.lock_vouch(p_voucher uuid, p_vouchee uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  select pg_advisory_xact_lock(
    hashtextextended(
      'vouch-pair:' || least(p_voucher, p_vouchee)::text || ':' || greatest(p_voucher, p_vouchee)::text,
      0
    )
  );
  select pg_advisory_xact_lock(hashtextextended('vouchee:' || p_vouchee::text, 0));
$$;

-- Las comprobaciones van en el orden de FR-011, así el motivo que vuelve dice lo mismo que habría
-- dicho la pantalla al abrir el perfil. Un aval que ya existe es éxito idempotente (FR-014).
create or replace function public.give_vouch(
  p_voucher uuid,
  p_vouchee_public_id text,
  p_pending_ttl interval
)
returns table (outcome text, created boolean, reached_level_three boolean)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_vouchee uuid;
  v_counted boolean;
begin
  select p.id into v_vouchee from public.profiles p where p.public_id = p_vouchee_public_id;
  if v_vouchee is null then
    return query select 'not_found'::text, false, false;
    return;
  end if;
  if v_vouchee = p_voucher then
    return query select 'self'::text, false, false;
    return;
  end if;

  perform private.lock_vouch(p_voucher, v_vouchee);

  if exists (
    select 1 from public.vouches x where x.voucher_id = p_voucher and x.vouchee_id = v_vouchee
  ) then
    return query select 'given'::text, false, false;
    return;
  end if;
  if exists (
    select 1 from public.vouches x where x.voucher_id = v_vouchee and x.vouchee_id = p_voucher
  ) then
    return query select 'reciprocal'::text, false, false;
    return;
  end if;
  if exists (
    select 1 from public.vouch_blocks b where b.voucher_id = p_voucher and b.vouchee_id = v_vouchee
  ) then
    return query select 'blocked'::text, false, false;
    return;
  end if;
  if not private.has_level_two(v_vouchee, p_pending_ttl) then
    return query select 'vouchee_level'::text, false, false;
    return;
  end if;
  if not private.has_level_two(p_voucher, p_pending_ttl) then
    return query select 'voucher_level'::text, false, false;
    return;
  end if;

  select exists (
    select 1
      from public.vouches x
     where x.vouchee_id = v_vouchee
       and private.has_level_two(x.voucher_id, p_pending_ttl)
  ) into v_counted;

  insert into public.vouches (voucher_id, vouchee_id) values (p_voucher, v_vouchee);
  return query select 'given'::text, true, not v_counted;
end;
$$;

-- Retirar lo que no está no es un error (FR-019).
create or replace function public.withdraw_vouch(p_voucher uuid, p_vouchee_public_id text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_vouchee uuid;
begin
  select p.id into v_vouchee from public.profiles p where p.public_id = p_vouchee_public_id;
  if v_vouchee is null or v_vouchee = p_voucher then
    return 'absent';
  end if;

  perform private.lock_vouch(p_voucher, v_vouchee);

  delete from public.vouches x where x.voucher_id = p_voucher and x.vouchee_id = v_vouchee;
  return case when found then 'withdrawn' else 'absent' end;
end;
$$;

-- La quita se inserta siempre, también si quien lo dio acababa de retirarlo (FR-018). Un id que no
-- es de ningún perfil no inserta nada.
create or replace function public.remove_vouch(p_vouchee uuid, p_voucher_public_id text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_voucher uuid;
  v_removed boolean;
begin
  select p.id into v_voucher from public.profiles p where p.public_id = p_voucher_public_id;
  if v_voucher is null or v_voucher = p_vouchee then
    return 'absent';
  end if;

  perform private.lock_vouch(v_voucher, p_vouchee);

  delete from public.vouches x where x.voucher_id = v_voucher and x.vouchee_id = p_vouchee;
  v_removed := found;
  insert into public.vouch_blocks (voucher_id, vouchee_id)
  values (v_voucher, p_vouchee)
  on conflict do nothing;
  return case when v_removed then 'removed' else 'absent' end;
end;
$$;

revoke all on function private.has_level_two(uuid, interval) from public, anon, authenticated;
revoke all on function private.lock_vouch(uuid, uuid) from public, anon, authenticated;
revoke all on function public.public_profile(text, interval) from public, anon, authenticated;
revoke all on function public.avatar_path_for(text) from public, anon, authenticated;
revoke all on function public.vouch_standing(uuid, text) from public, anon, authenticated;
revoke all on function public.my_vouches(uuid, interval) from public, anon, authenticated;
revoke all on function public.give_vouch(uuid, text, interval) from public, anon, authenticated;
revoke all on function public.withdraw_vouch(uuid, text) from public, anon, authenticated;
revoke all on function public.remove_vouch(uuid, text) from public, anon, authenticated;

grant execute on function public.public_profile(text, interval) to service_role;
grant execute on function public.avatar_path_for(text) to service_role;
grant execute on function public.vouch_standing(uuid, text) to service_role;
grant execute on function public.my_vouches(uuid, interval) to service_role;
grant execute on function public.give_vouch(uuid, text, interval) to service_role;
grant execute on function public.withdraw_vouch(uuid, text) to service_role;
grant execute on function public.remove_vouch(uuid, text) to service_role;
