-- Reportar, bloquear y suspender (historia #13). Tres tablas cerradas —suspensiones, reportes y
-- bloqueos— y una cuarta que nadie lee, la del número retenido. Toda escritura pasa por funciones
-- `security definer`; la lectura de quien administra, por RLS con su sesión. «Una cuenta suspendida
-- se ve como una que no existe» vive en las funciones que ya eran el punto único de cada lectura
-- (research R2), así que el listado, el perfil, los avales y los niveles cambian juntos.

-- ---------------------------------------------------------------------------------------------
-- Suspensiones
-- ---------------------------------------------------------------------------------------------

create table public.account_suspensions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  suspended_by uuid references auth.users (id) on delete set null,
  suspended_at timestamptz not null default now(),
  lifted_by uuid references auth.users (id) on delete set null,
  lifted_at timestamptz,
  constraint account_suspensions_reason_length check (char_length(btrim(reason)) between 1 and 1000),
  constraint account_suspensions_lifted_after check (lifted_at is null or lifted_at >= suspended_at)
);

comment on table public.account_suspensions is
  'Cada suspensión, vigente o levantada (research R1). Las levantadas son el historial que ve quien '
  'administra; `suspended_by` o `lifted_by` nulos son una cuenta que se borró (FR-033).';

-- Una sola vigente por cuenta: la segunda que llega a la vez choca acá (Edge Cases).
create unique index account_suspensions_open_idx on public.account_suspensions (user_id)
  where lifted_at is null;
create index account_suspensions_history_idx on public.account_suspensions (user_id, suspended_at desc);
create index account_suspensions_suspended_by_idx on public.account_suspensions (suspended_by);
create index account_suspensions_lifted_by_idx on public.account_suspensions (lifted_by);

alter table public.account_suspensions enable row level security;
revoke all on public.account_suspensions from anon, authenticated;
grant select on public.account_suspensions to authenticated;

-- La única pregunta por la suspensión (R1). `security definer` porque la tabla solo la lee quien
-- administra, y las policies de abajo la evalúan con la sesión de cualquiera.
create or replace function private.is_suspended(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.account_suspensions s
     where s.user_id = p_user
       and s.lifted_at is null
  );
$$;

-- Quien administra y está suspendida no abre ni resuelve nada, aunque llame con su token (R2).
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
     and not private.is_suspended((select auth.uid()));
$$;

-- Quien administra no lee las suspensiones propias (FR-010); la suspendida, ninguna (FR-042): la
-- suya la lee por `my_account_standing`.
create policy account_suspensions_select_admin on public.account_suspensions
  for select to authenticated
  using ((select private.is_admin()) and user_id <> (select auth.uid()));

-- La situación de quien tiene la sesión, para la puerta (research R4): cero filas si no está
-- suspendida.
create or replace function public.my_account_standing()
returns table (reason text, since timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.reason, s.suspended_at
    from public.account_suspensions s
   where s.user_id = (select auth.uid())
     and s.lifted_at is null;
$$;

-- ---------------------------------------------------------------------------------------------
-- Reportes
-- ---------------------------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  reported_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  resolution text,
  suspension_id uuid references public.account_suspensions (id) on delete set null,
  constraint reports_reason_valid check (
    reason in ('scam', 'animal_abuse', 'sells_animals', 'impersonation', 'harassment', 'other')
  ),
  constraint reports_details_length check (
    details is null or char_length(btrim(details)) between 1 and 1000
  ),
  constraint reports_other_has_details check (reason <> 'other' or details is not null),
  constraint reports_not_self check (reporter_id <> reported_id),
  constraint reports_resolution_valid check (resolution in ('dismissed', 'suspended')),
  constraint reports_resolution_matches check ((resolved_at is null) = (resolution is null)),
  constraint reports_suspension_only_suspended check (
    suspension_id is null or resolution = 'suspended'
  )
);

comment on table public.reports is
  'Los reportes de una persona sobre otra (research R5). `reporter_id` nulo es quien reportó y '
  'borró su cuenta (FR-041); los reportes sobre una cuenta borrada caen con ella.';

-- Un reporte igual sin resolver choca en la base, no en la aplicación (FR-004).
create unique index reports_open_once_idx on public.reports (reporter_id, reported_id, reason)
  where resolved_at is null;
create index reports_open_idx on public.reports (created_at) where resolved_at is null;
create index reports_history_idx on public.reports (reported_id, created_at desc);
create index reports_reporter_idx on public.reports (reporter_id);
create index reports_resolved_by_idx on public.reports (resolved_by);
create index reports_suspension_idx on public.reports (suspension_id);

alter table public.reports enable row level security;

-- Quien administra lee los reportes, salvo los que son sobre ella (FR-010), ni leyendo directo.
create policy reports_select_admin on public.reports
  for select to authenticated
  using ((select private.is_admin()) and reported_id <> (select auth.uid()));

revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Bloqueos
-- ---------------------------------------------------------------------------------------------

create table public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

comment on table public.blocks is
  'Quién bloqueó a quién (research R7). De una sola dirección: dos que se bloquean son dos filas.';

create index blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

-- La bloqueada no tiene policy: no se entera (FR-017). Quien administra los lee (FR-040).
create policy blocks_select_own_or_admin on public.blocks
  for select to authenticated
  using (blocker_id = (select auth.uid()) or (select private.is_admin()));

revoke all on public.blocks from anon, authenticated;
grant select on public.blocks to authenticated;

-- ---------------------------------------------------------------------------------------------
-- El número retenido
-- ---------------------------------------------------------------------------------------------

create table public.withheld_numbers (
  number_hash text primary key,
  until timestamptz not null,
  constraint withheld_numbers_hash_shape check (number_hash ~ '^[0-9a-f]{64}$')
);

comment on table public.withheld_numbers is
  'El número de una suspendida que borró su cuenta, como HMAC con la clave de Vault, y hasta '
  'cuándo no se verifica (research R8). Nada que lo una a una cuenta, y sin policies: nadie lo lee, '
  'tampoco quien administra (FR-028).';

alter table public.withheld_numbers enable row level security;
revoke all on public.withheld_numbers from anon, authenticated;

-- La clave vive solo en Vault. Si ya existe (otra base, otra corrida), no se toca.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'withheld_number_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'withheld_number_key',
      'La clave del HMAC de los números retenidos (historia #13, research R8).'
    );
  end if;
end;
$$;

-- Paridad con WITHHELD_MONTHS de lib/moderation/rules.ts.
create or replace function private.withheld_lifetime()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '12 months';
$$;

-- Nulo si falta la clave: quien la llama decide qué hacer sin ella.
create or replace function private.number_hash(p_number text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(
           extensions.hmac(
             p_number,
             (select d.decrypted_secret
                from vault.decrypted_secrets d
               where d.name = 'withheld_number_key'),
             'sha256'
           ),
           'hex'
         );
$$;

-- El número es el verificado de una cuenta suspendida, o está retenido y vigente. `until > now()`
-- y no la tarea: un día de atraso al purgar no traba a nadie.
create or replace function private.number_withheld(p_number text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
           select 1
             from public.phones ph
            where ph.verified_number = p_number
              and private.is_suspended(ph.user_id)
         )
      or exists (
           select 1
             from public.withheld_numbers w
            where w.number_hash = private.number_hash(p_number)
              and w.until > now()
         );
$$;

-- ---------------------------------------------------------------------------------------------
-- La regla de fondo: una cuenta suspendida se ve como una que no existe (research R2)
-- ---------------------------------------------------------------------------------------------

-- Un aval dado o recibido por una suspendida deja de contar en el mismo instante y vuelve al
-- reactivar sin escribir nada (FR-020, FR-023).
create or replace function private.has_level_two(p_user uuid, p_pending_ttl interval)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.identity_level_one(p_user, p_pending_ttl)
     and exists (select 1 from public.identity_verifications v where v.user_id = p_user)
     and not private.is_suspended(p_user);
$$;

-- El listado, la portada, la vista previa y las fotos firmadas dejan de ver sus animales juntos.
create or replace function private.pet_is_listed(p_owner uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.identity_level_one(p_owner, private.pending_ttl())
     and not private.is_suspended(p_owner);
$$;

-- Cero filas, igual que un perfil que no existe. Quienes avalan ya salen filtradas por
-- `has_level_two`.
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
                   jsonb_build_object(
                     'public_id', o.public_id,
                     'display_name', o.display_name,
                     'department', o.department,
                     'locality', o.locality,
                     'has_photo', o.avatar_path is not null
                   )
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
  where p.public_id = p_public_id
    and not private.is_suspended(p.id);
$$;

-- Las filas cuya otra parte está suspendida dejan de verse (FR-020), en lugar de mostrarse en
-- pausa, que diría que algo le falta a esa persona.
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
  where not private.is_suspended(r.other_id)
  order by r.direction, r.created_at desc;
$$;

-- Para quien no es la dueña, el animal de una suspendida no existe, como uno dado de baja: la
-- ficha dice «no está publicado» y no «no disponible por ahora» (FR-020, US2.7).
create or replace function public.pet_by_code(p_code text)
returns table (
  visibility text,
  is_owner boolean,
  state text,
  pet_id uuid,
  code text,
  name text,
  species text,
  sex text,
  age_value smallint,
  age_unit text,
  age_as_of date,
  size text,
  is_neutered boolean,
  vaccines text,
  has_chip boolean,
  good_with_kids text,
  good_with_dogs text,
  good_with_cats text,
  description text,
  department text,
  locality text,
  is_urgent boolean,
  published_at timestamptz,
  owner_folder uuid,
  photos jsonb,
  version text,
  publisher_name text,
  publisher_avatar_path text,
  publisher_is_rescuer boolean,
  publisher_level smallint,
  takedown_reason text,
  takedown_note text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_pet public.pets%rowtype;
  v_state text;
  v_visibility text;
  v_owner boolean;
begin
  select * into v_pet from public.pets p where p.code = p_code;
  if not found then
    return;
  end if;

  v_state := private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at);
  v_owner := coalesce((select auth.uid()) = v_pet.owner_id, false);

  if not v_owner and private.is_suspended(v_pet.owner_id) then
    return;
  end if;

  v_visibility := case
                    when v_state = 'taken_down' then 'hidden'
                    when v_state = 'paused' then 'paused'
                    when v_state = 'expired' then 'expired'
                    when not private.pet_is_listed(v_pet.owner_id) then 'hidden'
                    when v_state = 'adopted' then 'adopted'
                    else 'listed'
                  end;

  if not v_owner then
    if v_state = 'taken_down' then
      return;
    end if;
    if v_visibility not in ('listed', 'adopted') then
      visibility := v_visibility;
      is_owner := false;
      return next;
      return;
    end if;
  end if;

  return query
    select v_visibility,
           v_owner,
           v_state,
           case when v_owner then v_pet.id end,
           v_pet.code, v_pet.name, v_pet.species, v_pet.sex, v_pet.age_value, v_pet.age_unit,
           v_pet.age_as_of, v_pet.size, v_pet.is_neutered, v_pet.vaccines, v_pet.has_chip,
           v_pet.good_with_kids, v_pet.good_with_dogs, v_pet.good_with_cats, v_pet.description,
           v_pet.department, v_pet.locality, v_pet.is_urgent, v_pet.published_at,
           v_pet.owner_id,
           coalesce(
             (select jsonb_agg(
                       jsonb_build_object(
                         'id', ph.id, 'width', ph.width, 'height', ph.height,
                         'thumbhash', ph.thumbhash
                       ) order by ph.position
                     )
                from public.pet_photos ph
               where ph.pet_id = v_pet.id),
             '[]'::jsonb
           ),
           private.pet_share_version(
             (select ph.id from public.pet_photos ph where ph.pet_id = v_pet.id and ph.position = 0),
             v_pet.name, v_pet.department, v_pet.locality, v_pet.status = 'adopted'
           ),
           pr.display_name, pr.avatar_path, pr.is_rescuer,
           case
             when v_visibility in ('listed', 'adopted') then private.publisher_level(v_pet.owner_id)
           end,
           case when v_owner then v_pet.takedown_reason end,
           case when v_owner then v_pet.takedown_note end
      from (select 1) as one
      left join public.profiles pr on pr.id = v_pet.owner_id;
end;
$$;

-- Publicaciones por revisar saltea las de una cuenta suspendida; vuelven al reactivar si seguían
-- sin revisar (spec §Edge Cases).
create or replace function public.pet_review_queue(p_limit integer)
returns table (
  pet_id uuid,
  code text,
  name text,
  species text,
  sex text,
  age_value smallint,
  age_unit text,
  age_as_of date,
  size text,
  is_neutered boolean,
  vaccines text,
  has_chip boolean,
  good_with_kids text,
  good_with_dogs text,
  good_with_cats text,
  description text,
  department text,
  locality text,
  is_urgent boolean,
  state text,
  pending_kind text,
  pending_since timestamptz,
  is_own boolean,
  owner_folder uuid,
  photos jsonb,
  publisher_name text,
  publisher_avatar_path text,
  publisher_is_rescuer boolean,
  publisher_level smallint,
  total bigint,
  others bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    return;
  end if;

  return query
    select p.id, p.code, p.name, p.species, p.sex, p.age_value, p.age_unit, p.age_as_of, p.size,
           p.is_neutered, p.vaccines, p.has_chip, p.good_with_kids, p.good_with_dogs,
           p.good_with_cats, p.description, p.department, p.locality, p.is_urgent,
           private.pet_state(p.status, p.expires_at, p.taken_down_at),
           r.pending_kind, r.pending_since,
           p.owner_id = (select auth.uid()),
           p.owner_id,
           coalesce(
             (select jsonb_agg(
                       jsonb_build_object(
                         'id', ph.id, 'width', ph.width, 'height', ph.height,
                         'thumbhash', ph.thumbhash
                       ) order by ph.position
                     )
                from public.pet_photos ph
               where ph.pet_id = p.id),
             '[]'::jsonb
           ),
           pr.display_name, pr.avatar_path, pr.is_rescuer,
           -- Sin nivel 1 no hay escalera: la pantalla lo dice en palabras.
           case when private.pet_is_listed(p.owner_id) then private.publisher_level(p.owner_id) end,
           count(*) over (),
           count(*) filter (where p.owner_id <> (select auth.uid())) over ()
      from public.pet_reviews r
      join public.pets p on p.id = r.pet_id
      left join public.profiles pr on pr.id = p.owner_id
     where r.pending_since is not null
       and p.taken_down_at is null
       and not private.is_suspended(p.owner_id)
     order by r.pending_since, p.id
     limit least(greatest(coalesce(p_limit, 20), 1), 100);
end;
$$;

create or replace function public.count_pet_reviews()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when private.is_admin() then (
             select count(*)::integer
               from public.pet_reviews r
               join public.pets p on p.id = r.pet_id
              where r.pending_since is not null
                and p.taken_down_at is null
                and p.owner_id <> (select auth.uid())
                and not private.is_suspended(p.owner_id)
           )
           else 0
         end;
$$;

-- Las fotos que quien administra firma para revisar siguen a la lista: las de una suspendida, no.
create or replace function private.pet_photo_object_in_review(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with parts as (select storage.foldername(object_name) as folder)
  select exists (
    select 1
      from parts
      join public.pet_photos ph
        on parts.folder[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and ph.id = parts.folder[2]::uuid
       and ph.owner_id::text = parts.folder[1]
      join public.pets p on p.id = ph.pet_id
      join public.pet_reviews r on r.pet_id = p.id
     where r.pending_since is not null
       and p.taken_down_at is null
       and not private.is_suspended(p.owner_id)
  );
$$;

create or replace function private.avatar_object_in_review(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with parts as (select storage.foldername(object_name) as folder)
  select exists (
    select 1
      from parts
      join public.profiles pr
        on parts.folder[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and pr.id = parts.folder[1]::uuid
       and pr.avatar_path = object_name
     where not private.is_suspended(pr.id)
       and exists (
         select 1
           from public.pets p
           join public.pet_reviews r on r.pet_id = p.id
          where p.owner_id = pr.id
            and r.pending_since is not null
            and p.taken_down_at is null
       )
  );
$$;

-- Mientras dure la suspensión no sale ningún «¿sigue disponible?» ni se mide un vencimiento que la
-- reactivación deshace (research R3).
create or replace function public.claim_pet_reminders(p_limit integer)
returns table (pet_id uuid, owner_id uuid, name text, sex text, expires_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  with due as (
    select p.id
      from public.pets p
     where p.reminder_sent_at is null
       and p.taken_down_at is null
       and p.status in ('available', 'in_process')
       and p.expires_at > now()
       and p.expires_at <= now() + private.pet_reminder_lead()
       and not private.is_suspended(p.owner_id)
     order by p.expires_at
     limit greatest(coalesce(p_limit, 0), 0)
       for update skip locked
  )
  update public.pets p
     set reminder_sent_at = now()
    from due
   where p.id = due.id
  returning p.id, p.owner_id, p.name, p.sex, p.expires_at;
$$;

create or replace function public.claim_pet_expiries(p_limit integer)
returns table (status text, published_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  with due as (
    select p.id
      from public.pets p
     where p.expiry_counted_at is null
       and p.taken_down_at is null
       and p.status in ('available', 'in_process')
       and p.expires_at <= now()
       and not private.is_suspended(p.owner_id)
     order by p.expires_at
     limit greatest(coalesce(p_limit, 0), 0)
       for update skip locked
  )
  update public.pets p
     set expiry_counted_at = now()
    from due
   where p.id = due.id
  returning p.status, p.published_at;
$$;

-- Un enlace «Sigue disponible» de una suspendida no renueva nada y dice que no sirve, sin nada
-- que cuente la suspensión (spec §Edge Cases).
create or replace function public.renew_by_link(p_token_hash text, p_pending_ttl interval)
returns table (outcome text, pet_name text, sex text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet uuid;
  v_owner uuid;
  v_row public.pets%rowtype;
  v_state text;
  v_change record;
begin
  select l.pet_id, p.owner_id into v_pet, v_owner
    from public.pet_renewal_links l
    join public.pets p on p.id = l.pet_id
   where l.token_hash = p_token_hash
     and l.expires_at > now();
  if v_pet is null or private.is_suspended(v_owner) then
    return query select 'invalid', null::text, null::text, null::timestamptz;
    return;
  end if;

  perform public.lock_phone_account(v_owner);

  select * into v_row from public.pets p where p.id = v_pet for update;
  if not found then
    return query select 'invalid', null::text, null::text, null::timestamptz;
    return;
  end if;

  v_state := private.pet_state(v_row.status, v_row.expires_at, v_row.taken_down_at);
  if v_state in ('paused', 'adopted', 'taken_down') then
    return query select v_state, v_row.name, v_row.sex, v_row.expires_at;
    return;
  end if;

  select * into v_change
    from public.change_pet_status(
      v_owner, v_pet, case when v_state = 'expired' then 'republish' else 'renew' end, p_pending_ttl
    );

  return query
    select case
             when v_change.outcome <> 'done' then v_change.outcome
             when v_state = 'expired' then 'republished'
             else 'renewed'
           end,
           v_change.name, v_change.sex, v_change.expires_at;
end;
$$;

create or replace function public.renewal_link_view(p_token_hash text)
returns table (
  name text,
  sex text,
  state text,
  expires_at timestamptz,
  cover_id uuid,
  cover_owner uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.name, p.sex, private.pet_state(p.status, p.expires_at, p.taken_down_at), p.expires_at,
         ph.id, ph.owner_id
    from public.pet_renewal_links l
    join public.pets p on p.id = l.pet_id
    left join public.pet_photos ph
      on ph.pet_id = p.id and ph.position = 0 and p.taken_down_at is null
   where l.token_hash = p_token_hash
     and l.expires_at > now()
     and not private.is_suspended(p.owner_id);
$$;

-- Las escrituras que no pasan por el servidor: una suspendida tampoco cambia su perfil ni su foto
-- con su token directo (research R4).
alter policy profiles_update_own on public.profiles
  with check ((select auth.uid()) = id and not private.is_suspended((select auth.uid())));

alter policy avatars_own on storage.objects
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
    and not private.is_suspended((select auth.uid()))
  );

-- ---------------------------------------------------------------------------------------------
-- Reportar y cerrar (US1, research R5)
-- ---------------------------------------------------------------------------------------------

-- Con permisos de servicio y quien reporta como parámetro, como dar un aval: el id sale de la
-- sesión en el servidor.
--   created     se guardó
--   duplicate   ya hay uno igual sin resolver (FR-004)
--   self        es la propia cuenta
--   not_found   no existe, o está suspendida y quien reporta no la bloqueó (FR-002)
-- `blocked_already` dice si la confirmación ofrece bloquear (FR-005).
create or replace function public.create_report(
  p_reporter uuid,
  p_reported_public_id text,
  p_reason text,
  p_details text default null
)
returns table (outcome text, blocked_already boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target uuid;
  v_blocked boolean;
  v_id uuid;
begin
  select p.id into v_target from public.profiles p where p.public_id = p_reported_public_id;
  if v_target is null then
    return query select 'not_found', false;
    return;
  end if;
  if v_target = p_reporter then
    return query select 'self', false;
    return;
  end if;

  v_blocked := exists (
    select 1 from public.blocks b where b.blocker_id = p_reporter and b.blocked_id = v_target
  );
  if private.is_suspended(v_target) and not v_blocked then
    return query select 'not_found', false;
    return;
  end if;

  insert into public.reports (reporter_id, reported_id, reason, details)
  values (p_reporter, v_target, p_reason, nullif(btrim(p_details), ''))
  on conflict (reporter_id, reported_id, reason) where resolved_at is null do nothing
  returning id into v_id;

  return query select case when v_id is null then 'duplicate' else 'created' end, v_blocked;
end;
$$;

-- El historial de una persona para quien administra (FR-008): sus reportes cerrados y sus
-- suspensiones, de lo más nuevo a lo más viejo.
create or replace function private.report_history(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(entry order by at desc), '[]'::jsonb)
    from (
      select r.resolved_at as at,
             jsonb_build_object(
               'kind', 'report',
               'reason', r.reason,
               'details', r.details,
               'created_at', r.created_at,
               'resolution', r.resolution,
               'resolved_at', r.resolved_at
             ) as entry
        from public.reports r
       where r.reported_id = p_user
         and r.resolved_at is not null
      union all
      select s.suspended_at,
             jsonb_build_object(
               'kind', 'suspension',
               'reason', s.reason,
               'suspended_at', s.suspended_at,
               'lifted_at', s.lifted_at,
               'suspended_by', a.display_name
             )
        from public.account_suspensions s
        left join public.profiles a on a.id = s.suspended_by
       where s.user_id = p_user
    ) history;
$$;

-- Los sin resolver, del más viejo al más nuevo, para quien administra; ninguna fila para quien no
-- (FR-007). Los que son sobre quien mira no salen: solo cuentan, en `count_open_reports` (FR-010).
create or replace function public.report_queue()
returns table (
  report_id uuid,
  reason text,
  details text,
  created_at timestamptz,
  reporter_name text,
  reporter_public_id text,
  reporter_suspended boolean,
  reported_name text,
  reported_public_id text,
  reported_suspended boolean,
  history jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    return;
  end if;

  return query
    select r.id, r.reason, r.details, r.created_at,
           rp.display_name, rp.public_id,
           r.reporter_id is not null and private.is_suspended(r.reporter_id),
           tp.display_name, tp.public_id,
           private.is_suspended(r.reported_id),
           private.report_history(r.reported_id)
      from public.reports r
      join public.profiles tp on tp.id = r.reported_id
      left join public.profiles rp on rp.id = r.reporter_id
     where r.resolved_at is null
       and r.reported_id <> (select auth.uid())
     order by r.created_at, r.id;
end;
$$;

-- Cuántos esperan a quien mira (`others`, el número de «Mi perfil») y cuántos son sobre ella
-- (`own`, la línea de la lista). Ceros para quien no administra.
create or replace function public.count_open_reports()
returns table (others integer, own integer)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(count(*) filter (where r.reported_id <> (select auth.uid())), 0)::integer,
         coalesce(count(*) filter (where r.reported_id = (select auth.uid())), 0)::integer
    from public.reports r
   where r.resolved_at is null
     and private.is_admin();
$$;

-- Cerrar sin medidas, con el candado de la fila: dos personas que administran no cierran dos
-- veces (FR-011). Quién administra se pregunta acá adentro (FR-032).
--   done        se cerró
--   closed      ya estaba cerrado: cómo y quién (nulo, una cuenta borrada)
--   own         es sobre quien mira (FR-010)
--   gone        la cuenta reportada se borró, y el reporte con ella
--   not_admin   ya no administra
create or replace function public.close_report(p_report uuid)
returns table (
  decision text,
  resolution text,
  resolved_by_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.reports%rowtype;
begin
  if not private.is_admin() then
    return query select 'not_admin', null::text, null::text, null::timestamptz;
    return;
  end if;

  select * into v_report from public.reports r where r.id = p_report for update;
  if not found then
    return query select 'gone', null::text, null::text, null::timestamptz;
    return;
  end if;
  if v_report.reported_id = (select auth.uid()) then
    return query select 'own', null::text, null::text, null::timestamptz;
    return;
  end if;
  if v_report.resolved_at is not null then
    return query
      select 'closed', v_report.resolution, a.display_name, v_report.created_at
        from (select 1) as one
        left join public.profiles a on a.id = v_report.resolved_by;
    return;
  end if;

  update public.reports r
     set resolved_at = now(),
         resolved_by = (select auth.uid()),
         resolution = 'dismissed'
   where r.id = p_report;

  return query select 'done', 'dismissed', null::text, v_report.created_at;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Suspender y reactivar (US2, research R6 y R3)
-- ---------------------------------------------------------------------------------------------

-- Suspender, por cualquier camino, en una sola transacción: la fila, los reportes sin resolver
-- cerrados con ella (FR-012) y el pedido de identidad abierto retirado, con sus imágenes por la
-- cascada (FR-020). El candado es el de la cuenta en la verificación de identidad, así retirar el
-- pedido no choca con su revisión. Quién administra se pregunta acá adentro (FR-032).
--   done        se suspendió
--   already     ya había una vigente: quién (nulo, una cuenta borrada) y cuándo
--   self        es quien mira (FR-010)
--   gone        la cuenta, o el reporte desde el que se suspende, ya no existe (FR-032)
--   not_admin   ya no administra
-- `closed_reports` son los `created_at` de los reportes que cerró, para medir cada uno (R10).
create or replace function public.suspend_account(
  p_target_public_id text,
  p_reason text,
  p_report uuid default null
)
returns table (
  outcome text,
  user_id uuid,
  display_name text,
  suspended_at timestamptz,
  suspended_by_name text,
  withdrew_request boolean,
  closed_reports jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
  v_target uuid;
  v_name text;
  v_open record;
  v_id uuid;
  v_at timestamptz;
  v_withdrawn boolean;
  v_closed jsonb;
begin
  if not private.is_admin() then
    return query select 'not_admin', null::uuid, null::text, null::timestamptz, null::text,
                        false, '[]'::jsonb;
    return;
  end if;

  select p.id, p.display_name into v_target, v_name
    from public.profiles p
   where p.public_id = p_target_public_id;
  if v_target is null then
    return query select 'gone', null::uuid, null::text, null::timestamptz, null::text,
                        false, '[]'::jsonb;
    return;
  end if;
  if v_target = v_admin then
    return query select 'self', null::uuid, null::text, null::timestamptz, null::text,
                        false, '[]'::jsonb;
    return;
  end if;

  perform public.lock_identity_account(v_target);

  -- Con la cuenta tomada: un borrado en el medio espera a que esto termine, o ya terminó.
  perform 1 from auth.users u where u.id = v_target for key share;
  if not found
     or (p_report is not null
         and not exists (
           select 1 from public.reports r where r.id = p_report and r.reported_id = v_target
         )) then
    return query select 'gone', null::uuid, null::text, null::timestamptz, null::text,
                        false, '[]'::jsonb;
    return;
  end if;

  select s.suspended_at, a.display_name as by_name into v_open
    from public.account_suspensions s
    left join public.profiles a on a.id = s.suspended_by
   where s.user_id = v_target
     and s.lifted_at is null;
  if found then
    return query select 'already', null::uuid, v_name, v_open.suspended_at, v_open.by_name,
                        false, '[]'::jsonb;
    return;
  end if;

  insert into public.account_suspensions (user_id, reason, suspended_by)
  values (v_target, btrim(p_reason), v_admin)
  returning id, account_suspensions.suspended_at into v_id, v_at;

  with closed as (
    update public.reports r
       set resolved_at = v_at,
           resolved_by = v_admin,
           resolution = 'suspended',
           suspension_id = v_id
     where r.reported_id = v_target
       and r.resolved_at is null
    returning r.created_at
  )
  select coalesce(jsonb_agg(c.created_at order by c.created_at), '[]'::jsonb) into v_closed
    from closed c;

  select w.decision = 'withdrawn' into v_withdrawn
    from public.withdraw_identity_request(v_target) w;

  return query select 'done', v_target, v_name, v_at, null::text, coalesce(v_withdrawn, false),
                      v_closed;
end;
$$;

-- Reactivar (FR-022, FR-023): la suspensión queda levantada en el historial, y el tiempo suspendido
-- no cuenta para el vencimiento (R3): las publicaciones que estaban a la vista y sin vencer al
-- suspender se corren exactamente lo que duró. Una vencida antes sigue vencida; las pausadas y
-- adoptadas no tienen vencimiento.
--   done        se reactivó
--   already     ya estaba levantada: quién (nulo, una cuenta borrada) y cuándo
--   gone        la cuenta se borró, y la suspensión con ella (FR-032)
--   not_admin   ya no administra
create or replace function public.reactivate_account(p_suspension uuid)
returns table (
  outcome text,
  user_id uuid,
  display_name text,
  lifted_at timestamptz,
  lifted_by_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_row public.account_suspensions%rowtype;
  v_at timestamptz := now();
begin
  if not private.is_admin() then
    return query select 'not_admin', null::uuid, null::text, null::timestamptz, null::text;
    return;
  end if;

  select s.user_id into v_owner from public.account_suspensions s where s.id = p_suspension;
  if v_owner is null then
    return query select 'gone', null::uuid, null::text, null::timestamptz, null::text;
    return;
  end if;

  perform public.lock_identity_account(v_owner);

  select * into v_row from public.account_suspensions s where s.id = p_suspension for update;
  if not found then
    return query select 'gone', null::uuid, null::text, null::timestamptz, null::text;
    return;
  end if;
  if v_row.lifted_at is not null then
    return query
      select 'already', v_row.user_id, p.display_name, v_row.lifted_at, a.display_name
        from (select 1) as one
        left join public.profiles p on p.id = v_row.user_id
        left join public.profiles a on a.id = v_row.lifted_by;
    return;
  end if;

  update public.account_suspensions s
     set lifted_at = v_at,
         lifted_by = (select auth.uid())
   where s.id = p_suspension;

  update public.pets p
     set expires_at = p.expires_at + (v_at - v_row.suspended_at)
   where p.owner_id = v_row.user_id
     and p.taken_down_at is null
     and p.status in ('available', 'in_process')
     and p.expires_at > v_row.suspended_at;

  return query
    select 'done', v_row.user_id, p.display_name, v_at, null::text
      from (select 1) as one
      left join public.profiles p on p.id = v_row.user_id;
end;
$$;

-- Las vigentes, de la más reciente a la más vieja, con quién suspendió (nulo, una cuenta borrada).
-- Ninguna fila para quien no administra (FR-025).
create or replace function public.suspended_accounts()
returns table (
  suspension_id uuid,
  display_name text,
  public_id text,
  reason text,
  suspended_at timestamptz,
  suspended_by_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, p.display_name, p.public_id, s.reason, s.suspended_at, a.display_name
    from public.account_suspensions s
    join public.profiles p on p.id = s.user_id
    left join public.profiles a on a.id = s.suspended_by
   where s.lifted_at is null
     and s.user_id <> (select auth.uid())
     and private.is_admin()
   order by s.suspended_at desc, s.id;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function private.is_suspended(uuid) from public, anon, authenticated;
revoke all on function private.withheld_lifetime() from public, anon, authenticated;
revoke all on function private.number_hash(text) from public, anon, authenticated;
revoke all on function private.number_withheld(text) from public, anon, authenticated;
revoke all on function private.report_history(uuid) from public, anon, authenticated;
revoke all on function public.my_account_standing() from public, anon, authenticated;
revoke all on function public.create_report(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.report_queue() from public, anon, authenticated;
revoke all on function public.count_open_reports() from public, anon, authenticated;
revoke all on function public.close_report(uuid) from public, anon, authenticated;

-- Las policies de perfiles y de Storage la evalúan con la sesión de quien escribe.
grant execute on function private.is_suspended(uuid) to authenticated;
grant execute on function public.my_account_standing() to authenticated;
grant execute on function public.create_report(uuid, text, text, text) to service_role;
grant execute on function public.report_queue() to authenticated;
grant execute on function public.count_open_reports() to authenticated;
grant execute on function public.close_report(uuid) to authenticated;

revoke all on function public.suspend_account(text, text, uuid) from public, anon, authenticated;
revoke all on function public.reactivate_account(uuid) from public, anon, authenticated;
revoke all on function public.suspended_accounts() from public, anon, authenticated;
grant execute on function public.suspend_account(text, text, uuid) to authenticated;
grant execute on function public.reactivate_account(uuid) to authenticated;
grant execute on function public.suspended_accounts() to authenticated;
