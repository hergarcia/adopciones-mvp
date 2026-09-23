-- El teléfono verificado de la historia #10. Las reglas que tienen consecuencias —topes, intentos,
-- verificar— viven en funciones de esta migración, dentro de una transacción con candado: hechas en
-- la aplicación, veinte pedidos en paralelo pasan todos el chequeo del tope antes de que el primero
-- se anote. Los números de las reglas llegan como parámetros desde `lib/verification/rules.ts`, que
-- es su única fuente; acá no se repite ninguno.

create table public.phones (
  user_id uuid primary key references auth.users (id) on delete cascade,
  verified_number text unique,
  verified_at timestamptz,
  pending_number text,
  pending_since timestamptz,
  updated_at timestamptz not null default now(),

  constraint phones_verified_pair check ((verified_number is null) = (verified_at is null)),
  constraint phones_pending_pair check ((pending_number is null) = (pending_since is null)),
  constraint phones_verified_format check (verified_number ~ '^\+5989[1-9][0-9]{6}$'),
  constraint phones_pending_format check (pending_number ~ '^\+5989[1-9][0-9]{6}$'),
  -- Con nulos el check pasa: solo prohíbe tener a medias el mismo número que ya está verificado.
  constraint phones_pending_differs check (pending_number <> verified_number)
);

comment on table public.phones is
  'El teléfono de cada cuenta: el verificado y el número a medias. Nivel 1 no se guarda: se '
  'calcula en lib/verification/phone-status.ts. La dueña la lee y nadie la escribe desde el '
  'cliente: toda escritura pasa por las funciones de abajo, con permisos de servicio.';

comment on column public.phones.verified_number is
  'Único: un número verificado pertenece a una sola cuenta (FR-008). Dos cuentas que confirman el '
  'mismo número a la vez chocan acá y una sola gana (FR-008a).';

create trigger phones_touch_updated_at
  before update on public.phones
  for each row execute function public.touch_updated_at();

alter table public.phones enable row level security;

create policy phones_select_own on public.phones
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Sin policies de escritura, y sin permisos: si la dueña pudiera actualizar su fila, se pondría un
-- número verificado sin ningún código (FR-019d).
revoke all on public.phones from anon, authenticated;
grant select on public.phones to authenticated;

create table public.phone_number_sends (
  id bigint generated always as identity primary key,
  number_digest integer not null,
  sent_at timestamptz not null default now(),
  skipped boolean not null default false
);

comment on table public.phone_number_sends is
  'Cuántos códigos recibió cada grupo de números en 24 horas. Sin columna de cuenta, a propósito: '
  'es lo único que sobrevive al borrado de una cuenta (FR-021), y sobrevive porque no la nombra.';

comment on column public.phone_number_sends.number_digest is
  'Los primeros 15 bits del HMAC del número: cada grupo son unos 275 números, así que ni con la '
  'clave se sabe de cuál se trata (FR-021).';

comment on column public.phone_number_sends.skipped is
  'Un pedido que el tope por número frenó en silencio. No cuenta para ese tope, pero sí para el '
  'techo del sitio: si no contara, un sitio a un mensaje del techo delataría si el pedido anterior '
  'a un número salió o no (FR-011b).';

create index phone_number_sends_digest_idx on public.phone_number_sends (number_digest, sent_at desc);
create index phone_number_sends_sent_at_idx on public.phone_number_sends (sent_at);

alter table public.phone_number_sends enable row level security;
revoke all on public.phone_number_sends from anon, authenticated;

create table public.phone_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  number text,
  code_digest text,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  superseded_at timestamptz,
  consumed_at timestamptz,
  failed_attempts smallint not null default 0,
  delivery text not null,
  number_send_id bigint references public.phone_number_sends (id) on delete set null,

  constraint phone_codes_number_format check (number ~ '^\+5989[1-9][0-9]{6}$'),
  constraint phone_codes_failed_attempts_valid check (failed_attempts >= 0),
  constraint phone_codes_delivery_valid check (
    delivery in ('sending', 'sent', 'failed', 'rejected', 'skipped_rate_limit')
  )
);

comment on table public.phone_codes is
  'Cada código pedido. Existe para los topes de la cuenta y para distinguir un código reemplazado '
  'de uno equivocado (FR-007a). Dura 24 horas (FR-022). Nadie la lee desde el cliente.';

comment on column public.phone_codes.number is
  'En claro mientras el código está vivo, porque al verificar hay que saber qué número queda. Se '
  'borra apenas deja de estarlo: puede ser el número de otra persona por un error de tipeo '
  '(FR-023).';

comment on column public.phone_codes.code_digest is
  'HMAC del código con una clave que no está en la base: quien tenga una copia de esta tabla no '
  'puede recuperar un código vigente (FR-009b).';

comment on column public.phone_codes.delivery is
  'skipped_rate_limit es un código vivo como cualquier otro, que no salió porque el tope por número '
  'lo frenó en silencio: se comporta igual en todo lo observable (FR-006a). failed no cuenta para '
  'los topes de la cuenta (FR-009a); rejected sí, porque es un error de lo escrito (FR-002a).';

create index phone_codes_user_requested_idx on public.phone_codes (user_id, requested_at desc);
create index phone_codes_number_send_idx on public.phone_codes (number_send_id);

alter table public.phone_codes enable row level security;
revoke all on public.phone_codes from anon, authenticated;

-- El candado de una cuenta. Pedir, entregar, confirmar y cancelar de una misma cuenta se hacen de
-- a uno: sin esto, cinco intentos en paralelo se saltean el límite.
create or replace function public.lock_phone_account(p_user_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended('phone-user:' || p_user_id::text, 0));
$$;

-- Cuándo puede pedir la cuenta su próximo código: lo que más tarde se libere entre la espera, el
-- tope diario y el techo del sitio (FR-010a). Nulo si puede ya. No dice nada del tope por número,
-- que es mudo.
create or replace function public.next_phone_code_at(
  p_user_id uuid,
  p_min_gap interval,
  p_window interval,
  p_account_cap integer,
  p_site_cap integer
)
returns table (available_at timestamptz, reason text)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_last timestamptz;
  v_count integer;
  v_site_count integer;
  v_wait timestamptz;
  v_cap timestamptz;
  v_site timestamptz;
begin
  select max(c.requested_at), count(*)
    into v_last, v_count
    from public.phone_codes c
   where c.user_id = p_user_id
     and c.delivery <> 'failed'
     and c.requested_at > v_now - p_window;

  if v_last is not null and v_last + p_min_gap > v_now then
    v_wait := v_last + p_min_gap;
  end if;

  -- Se libera cuando el pedido que deja a la cuenta en el tope sale de la ventana.
  if v_count >= p_account_cap then
    select c.requested_at + p_window
      into v_cap
      from public.phone_codes c
     where c.user_id = p_user_id
       and c.delivery <> 'failed'
       and c.requested_at > v_now - p_window
     order by c.requested_at
    offset v_count - p_account_cap
     limit 1;
  end if;

  select count(*) into v_site_count
    from public.phone_number_sends s
   where s.sent_at > v_now - p_window;

  if v_site_count >= p_site_cap then
    select s.sent_at + p_window
      into v_site
      from public.phone_number_sends s
     where s.sent_at > v_now - p_window
     order by s.sent_at
    offset v_site_count - p_site_cap
     limit 1;
  end if;

  available_at := greatest(v_wait, v_cap, v_site);
  reason := case
    when available_at is null then null
    when available_at = v_site then 'site_cap'
    when available_at = v_cap then 'daily_cap'
    else 'wait'
  end;
  return next;
end;
$$;

-- Anota un pedido de código. El mensaje sale después, fuera de esta transacción, y
-- settle_phone_code cierra la entrega: mantener el candado mientras se espera a Twilio
-- serializaría todo el sitio detrás de una llamada de red.
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

-- Cierra la entrega de un pedido. Toma el candado de la cuenta: entre reserve y settle pasa una
-- llamada de red, y en ese rato la persona pudo cancelar o confirmar en otra pestaña.
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
    -- nada de lo que la persona tenía (FR-006).
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
end;
$$;

-- Compara lo escrito con el código vivo y decide lo que tiene consecuencias: consumir, verificar,
-- sumar un intento. Devuelve hechos; qué mensaje ve la persona lo decide
-- lib/verification/code-check.ts.
create or replace function public.check_phone_code(
  p_user_id uuid,
  p_code_digest text,
  p_max_attempts integer,
  p_window interval
)
returns table (
  verified boolean,
  was_change boolean,
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

  select p.pending_number, p.verified_number
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

  update public.phone_codes c set consumed_at = v_now, number = null where c.id = v_live.id;
  was_change := v_phone.verified_number is not null;

  begin
    update public.phones p
       set verified_number = v_live.number,
           verified_at = v_now,
           pending_number = null,
           pending_since = null
     where p.user_id = p_user_id;
    verified := true;
  exception when unique_violation then
    -- El número es de otra cuenta (FR-008). El código queda usado y la cuenta vuelve a como estaba
    -- antes de pedirlo (FR-008b).
    update public.phones p
       set pending_number = null, pending_since = null
     where p.user_id = p_user_id;
    delete from public.phones p
     where p.user_id = p_user_id and p.verified_number is null and p.pending_number is null;
    in_use := true;
  end;

  return next;
end;
$$;

-- Cancela el número a medias. Si había uno verificado, queda como estaba y con su fecha original
-- (FR-017b). Reemplaza también los pedidos en `sending`, para que un settle que llega tarde no lo
-- reviva.
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
   where p.user_id = p_user_id and p.verified_number is null and p.pending_number is null;

  return coalesce(v_had_pending, false);
end;
$$;

-- Corre al pedir un código, que es lo único que hace crecer estas tablas. Cuando exista el cron
-- diario (M5) corre ahí también y deja de depender del tráfico.
create or replace function public.purge_phone_records(p_window interval, p_pending_ttl interval)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.phone_codes c where c.requested_at < now() - p_window;
  delete from public.phone_number_sends s where s.sent_at < now() - p_window;
  update public.phones p
     set pending_number = null, pending_since = null
   where p.pending_since < now() - p_pending_ttl;
  delete from public.phones p where p.verified_number is null and p.pending_number is null;
$$;

-- Supabase concede `execute` a anon y authenticated sobre toda función nueva de public. Estas solo
-- las llama el servidor con permisos de servicio, después de comprobar la sesión.
revoke all on function public.lock_phone_account(uuid) from public, anon, authenticated;
revoke all on function public.next_phone_code_at(uuid, interval, interval, integer, integer)
  from public, anon, authenticated;
revoke all on function public.reserve_phone_code(
  uuid, text, integer, text, interval, interval, interval, integer, integer, integer
) from public, anon, authenticated;
revoke all on function public.settle_phone_code(uuid, text) from public, anon, authenticated;
revoke all on function public.check_phone_code(uuid, text, integer, interval)
  from public, anon, authenticated;
revoke all on function public.cancel_pending_phone(uuid) from public, anon, authenticated;
revoke all on function public.purge_phone_records(interval, interval) from public, anon, authenticated;

grant execute on function public.lock_phone_account(uuid) to service_role;
grant execute on function public.next_phone_code_at(uuid, interval, interval, integer, integer)
  to service_role;
grant execute on function public.reserve_phone_code(
  uuid, text, integer, text, interval, interval, interval, integer, integer, integer
) to service_role;
grant execute on function public.settle_phone_code(uuid, text) to service_role;
grant execute on function public.check_phone_code(uuid, text, integer, interval) to service_role;
grant execute on function public.cancel_pending_phone(uuid) to service_role;
grant execute on function public.purge_phone_records(interval, interval) to service_role;
