-- «Cómo le va a…» (historia #269): por cada animal publicado solo o cada camada, cuántas veces se
-- abrió su ficha, cuántas se tocó «Quiero adoptar» y cuántos toques frenó la verificación, y desde
-- cuándo se cuenta. Sin quién, cuándo ni desde dónde (FR-026, Ley 18.331). Suma solo el servidor y
-- lee solo quien publicó, tampoco quien administra (research R1, R3, R6).

create table public.publication_stats (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid unique references public.pets (id) on delete cascade,
  litter_id uuid unique references public.litters (id) on delete cascade,
  opens integer not null default 0,
  taps integer not null default 0,
  phone_stops integer not null default 0,
  identity_stops integer not null default 0,
  counted_since date not null default public.uruguay_today(),
  from_publication boolean not null default true,

  constraint publication_stats_one_publication check (num_nonnulls(pet_id, litter_id) = 1),
  constraint publication_stats_opens_valid check (opens >= 0),
  constraint publication_stats_taps_valid check (taps >= 0),
  constraint publication_stats_phone_stops_valid check (phone_stops >= 0),
  constraint publication_stats_identity_stops_valid check (identity_stops >= 0)
);

comment on table public.publication_stats is
  'Cuántas veces se abrió la ficha de cada publicación, cuántas se tocó «Quiero adoptar» y cuántos '
  'toques frenó el teléfono o la identidad, sin quién, cuándo ni desde dónde (historia #269, '
  'FR-026). `from_publication` falso: la publicación es anterior a la historia y se cuenta desde '
  '`counted_since`.';

alter table public.publication_stats enable row level security;
revoke all on public.publication_stats from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- La fila nace con la publicación; una cría suma en su camada y no tiene fila (R2, FR-008)
-- ---------------------------------------------------------------------------------------------

create function private.publication_stats_for_pet()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.publication_stats (pet_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create function private.publication_stats_for_litter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.publication_stats (litter_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

revoke all on function private.publication_stats_for_pet() from public, anon, authenticated;
revoke all on function private.publication_stats_for_litter() from public, anon, authenticated;

create trigger pets_publication_stats
  after insert on public.pets
  for each row when (new.litter_id is null)
  execute function private.publication_stats_for_pet();

create trigger litters_publication_stats
  after insert on public.litters
  for each row execute function private.publication_stats_for_litter();

-- Lo publicado antes de la historia se cuenta desde hoy, y lo dice (FR-011, FR-012).
insert into public.publication_stats (pet_id, from_publication)
select p.id, false from public.pets p where p.litter_id is null
on conflict do nothing;

insert into public.publication_stats (litter_id, from_publication)
select l.id, false from public.litters l
on conflict do nothing;

-- ---------------------------------------------------------------------------------------------
-- Sumar: solo el servidor, una sentencia por cuenta, así dos a la vez suman las dos (R3, FR-010)
-- ---------------------------------------------------------------------------------------------

-- La apertura de la ficha de un animal publicado solo. Quien publicó no suma, tampoco cuando la ve
-- oculta; un código que no existe o el de una cría no suman nada (FR-002, FR-003).
create function public.count_pet_open(p_code text, p_viewer uuid default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.publication_stats s
     set opens = s.opens + 1
    from public.pets p
   where p.code = p_code
     and p.litter_id is null
     and p.owner_id is distinct from p_viewer
     and s.pet_id = p.id;
$$;

create function public.count_litter_open(p_code text, p_viewer uuid default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.publication_stats s
     set opens = s.opens + 1
    from public.litters l
   where l.code = p_code
     and l.owner_id is distinct from p_viewer
     and s.litter_id = l.id;
$$;

-- Un toque de «Quiero adoptar» y su freno, en el animal o en la camada de la cría. Quien publicó no
-- suma: llega solo por una dirección armada a mano (spec §Edge Cases).
-- Sin sesión, `p_viewer` no va; sin freno, `p_stop` tampoco.
create function public.count_apply_tap(
  p_code text,
  p_viewer uuid default null,
  p_tap boolean default false,
  p_stop text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_stop is not null and p_stop not in ('phone', 'identity') then
    raise exception 'freno fuera de la lista: %', p_stop using errcode = '22023';
  end if;

  update public.publication_stats s
     set taps = s.taps + (case when p_tap then 1 else 0 end),
         phone_stops = s.phone_stops + (case when p_stop = 'phone' then 1 else 0 end),
         identity_stops = s.identity_stops + (case when p_stop = 'identity' then 1 else 0 end)
    from public.pets p
   where p.code = p_code
     and p.owner_id is distinct from p_viewer
     and (s.pet_id = p.id and p.litter_id is null or s.litter_id = p.litter_id);
end;
$$;

revoke all on function public.count_pet_open(text, uuid) from public, anon, authenticated;
revoke all on function public.count_litter_open(text, uuid) from public, anon, authenticated;
revoke all on function public.count_apply_tap(text, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.count_pet_open(text, uuid) to service_role;
grant execute on function public.count_litter_open(text, uuid) to service_role;
grant execute on function public.count_apply_tap(text, uuid, boolean, text) to service_role;

-- ---------------------------------------------------------------------------------------------
-- Leer: una fila solo para quien publicó (R6, FR-025)
-- ---------------------------------------------------------------------------------------------

-- Las solicitudes no se copian: se cuentan las que el sitio guarda de esa publicación o de sus
-- crías, en cualquier estado (FR-007). El código, el nombre y el sexo arman los textos del bloque y
-- el texto para el grupo del vacío; una camada no tiene sexo.
create function public.my_publication_stats(p_pet uuid default null, p_litter uuid default null)
returns table (
  opens integer,
  taps integer,
  phone_stops integer,
  identity_stops integer,
  applications integer,
  counted_since date,
  from_publication boolean,
  required_level smallint,
  code text,
  name text,
  sex text
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.opens, s.taps, s.phone_stops, s.identity_stops,
         (select count(*)::integer from public.applications a where a.pet_id = p.id),
         s.counted_since, s.from_publication, p.required_level, p.code, p.name, p.sex
    from public.publication_stats s
    join public.pets p on p.id = s.pet_id
   where p_litter is null
     and p.id = p_pet
     and p.litter_id is null
     and p.owner_id = (select auth.uid())
  union all
  select s.opens, s.taps, s.phone_stops, s.identity_stops,
         (select count(*)::integer
            from public.applications a
            join public.pets y on y.id = a.pet_id
           where y.litter_id = l.id),
         s.counted_since, s.from_publication, l.required_level, l.code, l.name, null
    from public.publication_stats s
    join public.litters l on l.id = s.litter_id
   where p_pet is null
     and l.id = p_litter
     and l.owner_id = (select auth.uid());
$$;

revoke all on function public.my_publication_stats(uuid, uuid) from public, anon, authenticated;
grant execute on function public.my_publication_stats(uuid, uuid) to authenticated;
