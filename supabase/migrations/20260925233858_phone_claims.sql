-- Quedarse con un número verificado en otra cuenta (historia #25). La prueba de que la cuenta
-- escribió bien el código vive aparte de los códigos, y quedarse con el número es una sola función
-- con los candados de las dos cuentas y el del número: hecho en la aplicación, dos reclamos en
-- paralelo dejarían el número en dos cuentas o en ninguna. Nada de lo que queda une a las dos
-- cuentas con más precisión que el día (FR-013).

create table public.phone_claims (
  user_id uuid primary key references auth.users (id) on delete cascade,
  number text not null,
  valid_until timestamptz not null,

  constraint phone_claims_number_format check (number ~ '^\+5989[1-9][0-9]{6}$')
);

comment on table public.phone_claims is
  'La prueba de una cuenta: escribió bien el código de un número verificado en otra. Una por '
  'cuenta, la última (FR-005). Nadie la lee desde el cliente, tampoco la dueña (FR-013e): solo las '
  'funciones de abajo, con permisos de servicio.';

comment on column public.phone_claims.number is
  'En claro, porque al confirmar hay que saber cuál. Vive lo que vive la prueba: se borra al '
  'confirmar, al reemplazarse, cuando el número se verifica en cualquier cuenta y en la purga '
  '(FR-013e).';

comment on column public.phone_claims.valid_until is
  'El vencimiento del código escrito. Toda función compara contra now(): una prueba vencida no '
  'sirve aunque la purga todavía no la haya borrado.';

create index phone_claims_number_idx on public.phone_claims (number);

alter table public.phone_claims enable row level security;
revoke all on public.phone_claims from anon, authenticated;

alter table public.phones add column number_lost_on date;

alter table public.phones
  add constraint phones_lost_or_verified check (verified_number is null or number_lost_on is null);

comment on column public.phones.number_lost_on is
  'El día de Uruguay en que la cuenta perdió su número porque otra demostró tenerlo (FR-011a). '
  'Solo el día, a propósito: una hora uniría a las dos cuentas (FR-013).';

-- Nadie lo leía, y al quedarse con un número marcaría el mismo instante en las dos filas: sería
-- exactamente el registro que une a las dos cuentas (FR-013f).
drop trigger phones_touch_updated_at on public.phones;
alter table public.phones drop column updated_at;

create or replace function public.lock_phone_number(p_number text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended('phone-number:' || p_number, 0));
$$;

create or replace function public.get_phone_claim(p_user_id uuid)
returns table (number text, valid_until timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.number, c.valid_until
    from public.phone_claims c
   where c.user_id = p_user_id
     and c.valid_until > now();
$$;

create or replace function public.drop_phone_claim(p_user_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.phone_claims c where c.user_id = p_user_id;
$$;

-- Todo o nada. Los candados de cuenta se toman en orden de id, así A reclamando a B y B reclamando
-- a A no se traban; el del número va después y serializa lo que no tiene dueño. Ninguna función
-- toma un candado de cuenta después de uno de número, así que no hay ciclo.
create or replace function public.claim_phone_number(p_user_id uuid, p_time_zone text)
returns table (
  outcome text,
  was_change boolean,
  was_lost boolean,
  previous_user_id uuid,
  lost_on date
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_number text;
  v_owner uuid;
  v_own record;
begin
  outcome := 'no_claim';
  was_change := false;
  was_lost := false;

  select c.number into v_number
    from public.phone_claims c
   where c.user_id = p_user_id and c.valid_until > now();
  if v_number is null then
    return next;
    return;
  end if;

  select p.user_id into v_owner from public.phones p where p.verified_number = v_number;

  if v_owner is null or v_owner = p_user_id then
    perform public.lock_phone_account(p_user_id);
  elsif v_owner < p_user_id then
    perform public.lock_phone_account(v_owner);
    perform public.lock_phone_account(p_user_id);
  else
    perform public.lock_phone_account(p_user_id);
    perform public.lock_phone_account(v_owner);
  end if;
  perform public.lock_phone_number(v_number);

  -- Con los candados, lo que cambió en el medio manda. Si el número pasó a otra cuenta, esa lo
  -- verificó y borró esta prueba (FR-009a); si quedó libre, se verifica como uno común (FR-009).
  select c.number into v_number
    from public.phone_claims c
   where c.user_id = p_user_id and c.valid_until > now();
  if v_number is null then
    return next;
    return;
  end if;

  select p.user_id into previous_user_id from public.phones p where p.verified_number = v_number;
  if (previous_user_id is not null and previous_user_id is distinct from v_owner)
     or previous_user_id = p_user_id then
    delete from public.phone_claims c where c.user_id = p_user_id;
    previous_user_id := null;
    return next;
    return;
  end if;

  select p.verified_number, p.number_lost_on into v_own
    from public.phones p
   where p.user_id = p_user_id;

  begin
    if previous_user_id is not null then
      lost_on := (now() at time zone p_time_zone)::date;
      -- El cambio a medias de la cuenta anterior queda con su código vivo (FR-007.4).
      update public.phones p
         set verified_number = null, verified_at = null, number_lost_on = lost_on
       where p.user_id = previous_user_id;
    end if;

    insert into public.phones (user_id, verified_number, verified_at)
    values (
      p_user_id,
      v_number,
      date_trunc('day', now() at time zone p_time_zone) at time zone p_time_zone
    )
    on conflict (user_id) do update
      set verified_number = excluded.verified_number,
          verified_at = excluded.verified_at,
          pending_number = null,
          pending_since = null,
          number_lost_on = null;
  exception when unique_violation then
    previous_user_id := null;
    lost_on := null;
    return next;
    return;
  end;

  update public.phone_codes c
     set superseded_at = now(), number = null
   where c.user_id = p_user_id
     and c.superseded_at is null
     and c.consumed_at is null
     and c.delivery in ('sending', 'sent', 'skipped_rate_limit');

  delete from public.phone_claims c where c.number = v_number;

  outcome := case when previous_user_id is null then 'verified_free' else 'claimed' end;
  was_change := v_own.verified_number is not null;
  was_lost := v_own.number_lost_on is not null;
  return next;
end;
$$;

-- El tipo de retorno suma `was_lost`, y `create or replace` no cambia un tipo de retorno.
drop function public.check_phone_code(uuid, text, integer, interval);

create function public.check_phone_code(
  p_user_id uuid,
  p_code_digest text,
  p_max_attempts integer,
  p_window interval
)
returns table (
  verified boolean,
  was_change boolean,
  was_lost boolean,
  in_use boolean,
  no_pending boolean,
  no_live_code boolean,
  matches_superseded boolean,
  expired boolean,
  exhausted boolean,
  attempts_left integer,
  live_number text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_phone record;
  v_live record;
  v_attempts integer;
begin
  perform public.lock_phone_account(p_user_id);

  verified := false;
  was_change := false;
  was_lost := false;
  in_use := false;
  no_pending := false;
  no_live_code := false;
  expired := false;
  exhausted := false;

  select exists (
    select 1 from public.phone_codes c
     where c.user_id = p_user_id
       and c.superseded_at is not null
       and c.code_digest = p_code_digest
       and c.requested_at > v_now - p_window
  ) into matches_superseded;

  select p.pending_number, p.verified_number, p.number_lost_on
    into v_phone
    from public.phones p
   where p.user_id = p_user_id;

  if v_phone.pending_number is null then
    no_pending := true;
    return next;
    return;
  end if;

  select c.id, c.number, c.code_digest, c.expires_at, c.failed_attempts
    into v_live
    from public.phone_codes c
   where c.user_id = p_user_id
     and c.delivery in ('sent', 'skipped_rate_limit')
     and c.consumed_at is null
     and c.superseded_at is null
   order by c.requested_at desc
   limit 1;

  if v_live.id is null then
    no_live_code := true;
    return next;
    return;
  end if;

  live_number := v_live.number;
  expired := v_live.expires_at <= v_now;
  exhausted := v_live.failed_attempts >= p_max_attempts;

  if expired or exhausted then
    attempts_left := greatest(p_max_attempts - v_live.failed_attempts, 0);
    return next;
    return;
  end if;

  if v_live.code_digest is distinct from p_code_digest then
    -- También si coincide con uno reemplazado: para el vivo, es un intento más de adivinarlo.
    update public.phone_codes c
       set failed_attempts = c.failed_attempts + 1
     where c.id = v_live.id
    returning c.failed_attempts into v_attempts;

    attempts_left := greatest(p_max_attempts - v_attempts, 0);
    exhausted := v_attempts >= p_max_attempts;
    return next;
    return;
  end if;

  -- Serializa con un reclamo del mismo número: una prueba no puede escribirse después de que una
  -- verificación borró las ajenas, y un número libre no lo verifican dos a la vez (FR-009a).
  perform public.lock_phone_number(v_live.number);

  update public.phone_codes c set consumed_at = v_now, number = null where c.id = v_live.id;
  was_change := v_phone.verified_number is not null;

  begin
    update public.phones p
       set verified_number = v_live.number,
           verified_at = v_now,
           pending_number = null,
           pending_since = null,
           number_lost_on = null
     where p.user_id = p_user_id;
    verified := true;
    was_lost := v_phone.number_lost_on is not null;
    -- Quien lo reclamaba demostraba el número frente a la cuenta anterior, no frente a esta (FR-005).
    delete from public.phone_claims c where c.number = v_live.number and c.user_id <> p_user_id;
  exception when unique_violation then
    -- El número es de otra cuenta (FR-008 de la #10). El código queda usado, la cuenta vuelve a
    -- como estaba antes de pedirlo, y queda la prueba para quedarse con él (FR-005).
    update public.phones p
       set pending_number = null, pending_since = null
     where p.user_id = p_user_id;
    delete from public.phones p
     where p.user_id = p_user_id
       and p.verified_number is null
       and p.pending_number is null
       and p.number_lost_on is null;
    insert into public.phone_claims (user_id, number, valid_until)
    values (p_user_id, v_live.number, v_live.expires_at)
    on conflict (user_id) do update
      set number = excluded.number, valid_until = excluded.valid_until;
    in_use := true;
  end;

  return next;
end;
$$;

-- Un pedido que deja un código vivo deja sin efecto la prueba: vale solamente la última (FR-005).
create or replace function public.reserve_phone_code(
  p_user_id uuid,
  p_number text,
  p_number_digest integer,
  p_code_digest text,
  p_code_ttl interval,
  p_min_gap interval,
  p_window interval,
  p_account_cap integer,
  p_number_cap integer,
  p_site_cap integer
)
returns table (
  decision text,
  code_id uuid,
  retry_at timestamptz,
  reached_cap boolean,
  reached_site_cap boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_verified text;
  v_next record;
  v_account_count integer;
  v_site_count integer;
  v_number_count integer;
  v_send_id bigint;
  v_skip boolean;
begin
  perform public.lock_phone_account(p_user_id);
  -- Después del de la cuenta, siempre en este orden: las otras funciones no toman este, así que no
  -- hay ciclo posible. Cuida el tope por número y el techo entre cuentas distintas.
  perform pg_advisory_xact_lock(hashtextextended('phone-sends', 0));

  select p.verified_number into v_verified from public.phones p where p.user_id = p_user_id;
  if v_verified = p_number then
    decision := 'same_number';
    return next;
    return;
  end if;

  select * into v_next
    from public.next_phone_code_at(p_user_id, p_min_gap, p_window, p_account_cap, p_site_cap);
  if v_next.available_at is not null then
    decision := v_next.reason;
    retry_at := v_next.available_at;
    return next;
    return;
  end if;

  select count(*) into v_account_count
    from public.phone_codes c
   where c.user_id = p_user_id
     and c.delivery <> 'failed'
     and c.requested_at > v_now - p_window;

  select count(*) into v_site_count
    from public.phone_number_sends s
   where s.sent_at > v_now - p_window;

  select count(*) into v_number_count
    from public.phone_number_sends s
   where s.number_digest = p_number_digest
     and not s.skipped
     and s.sent_at > v_now - p_window;

  v_skip := v_number_count >= p_number_cap;

  insert into public.phone_number_sends (number_digest, skipped)
  values (p_number_digest, v_skip)
  returning id into v_send_id;

  reached_cap := v_account_count + 1 >= p_account_cap;
  reached_site_cap := v_site_count + 1 >= p_site_cap;

  if v_skip then
    -- Frenado en silencio, y en todo lo observable igual que un pedido que salió (FR-006a): un
    -- código vivo nuevo, que reemplaza al anterior y deja el número a medias. Solo que no sale.
    update public.phone_codes c
       set superseded_at = v_now, number = null
     where c.user_id = p_user_id
       and c.superseded_at is null
       and c.consumed_at is null
       and c.delivery in ('sending', 'sent', 'skipped_rate_limit');

    insert into public.phone_codes (user_id, number, code_digest, expires_at, delivery, number_send_id)
    values (p_user_id, p_number, p_code_digest, v_now + p_code_ttl, 'skipped_rate_limit', v_send_id)
    returning id into code_id;

    insert into public.phones (user_id, pending_number, pending_since)
    values (p_user_id, p_number, v_now)
    on conflict (user_id) do update
      set pending_number = excluded.pending_number, pending_since = excluded.pending_since;

    delete from public.phone_claims c where c.user_id = p_user_id;

    decision := 'skip';
  else
    insert into public.phone_codes (user_id, number, code_digest, expires_at, delivery, number_send_id)
    values (p_user_id, p_number, p_code_digest, v_now + p_code_ttl, 'sending', v_send_id)
    returning id into code_id;

    decision := 'send';
  end if;

  return next;
end;
$$;

create or replace function public.settle_phone_code(p_code_id uuid, p_outcome text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_code record;
  v_verified text;
begin
  if p_outcome not in ('sent', 'rejected', 'failed') then
    raise exception 'settle_phone_code: resultado desconocido %', p_outcome;
  end if;

  select c.user_id into v_user_id from public.phone_codes c where c.id = p_code_id;
  if v_user_id is null then
    return;
  end if;

  perform public.lock_phone_account(v_user_id);

  select * into v_code from public.phone_codes c where c.id = p_code_id;

  if p_outcome <> 'sent' then
    -- No salió ningún mensaje: no cuenta para el tope por número ni para el techo, y no cambia
    -- nada de lo que la persona tenía, tampoco su prueba (FR-006 de la #10, FR-005).
    update public.phone_codes c
       set delivery = p_outcome, code_digest = null, number = null
     where c.id = p_code_id;
    delete from public.phone_number_sends s where s.id = v_code.number_send_id;
    return;
  end if;

  update public.phone_codes c set delivery = 'sent' where c.id = p_code_id;

  -- Si en el medio se canceló, el pedido ya está reemplazado: no se revive el número a medias.
  if v_code.superseded_at is not null then
    return;
  end if;

  select p.verified_number into v_verified from public.phones p where p.user_id = v_user_id;
  if v_verified = v_code.number then
    update public.phone_codes c set superseded_at = now(), number = null where c.id = p_code_id;
    return;
  end if;

  update public.phone_codes c
     set superseded_at = now(), number = null
   where c.user_id = v_user_id
     and c.id <> p_code_id
     and c.superseded_at is null
     and c.consumed_at is null
     and c.delivery in ('sending', 'sent', 'skipped_rate_limit');

  insert into public.phones (user_id, pending_number, pending_since)
  values (v_user_id, v_code.number, now())
  on conflict (user_id) do update
    set pending_number = excluded.pending_number, pending_since = excluded.pending_since;

  delete from public.phone_claims c where c.user_id = v_user_id;
end;
$$;

-- Una fila que solo guarda el día en que se perdió el número no está vacía: es el aviso (FR-011a).
create or replace function public.cancel_pending_phone(p_user_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_had_pending boolean;
begin
  perform public.lock_phone_account(p_user_id);

  update public.phone_codes c
     set superseded_at = now(), number = null
   where c.user_id = p_user_id
     and c.superseded_at is null
     and c.consumed_at is null
     and c.delivery in ('sending', 'sent', 'skipped_rate_limit');

  update public.phones p
     set pending_number = null, pending_since = null
   where p.user_id = p_user_id and p.pending_number is not null
  returning true into v_had_pending;

  delete from public.phones p
   where p.user_id = p_user_id
     and p.verified_number is null
     and p.pending_number is null
     and p.number_lost_on is null;

  return coalesce(v_had_pending, false);
end;
$$;

create or replace function public.purge_phone_records(p_window interval, p_pending_ttl interval)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.phone_codes c where c.requested_at < now() - p_window;
  delete from public.phone_number_sends s where s.sent_at < now() - p_window;
  delete from public.phone_claims c where c.valid_until <= now();
  update public.phones p
     set pending_number = null, pending_since = null
   where p.pending_since < now() - p_pending_ttl;
  delete from public.phones p
   where p.verified_number is null and p.pending_number is null and p.number_lost_on is null;
$$;

-- Supabase concede `execute` a anon y authenticated sobre toda función nueva de public, también a
-- la que se vuelve a crear con `drop` + `create`.
revoke all on function public.lock_phone_number(text) from public, anon, authenticated;
revoke all on function public.get_phone_claim(uuid) from public, anon, authenticated;
revoke all on function public.drop_phone_claim(uuid) from public, anon, authenticated;
revoke all on function public.claim_phone_number(uuid, text) from public, anon, authenticated;
revoke all on function public.check_phone_code(uuid, text, integer, interval)
  from public, anon, authenticated;

grant execute on function public.lock_phone_number(text) to service_role;
grant execute on function public.get_phone_claim(uuid) to service_role;
grant execute on function public.drop_phone_claim(uuid) to service_role;
grant execute on function public.claim_phone_number(uuid, text) to service_role;
grant execute on function public.check_phone_code(uuid, text, integer, interval) to service_role;
