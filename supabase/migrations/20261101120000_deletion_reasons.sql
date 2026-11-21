-- «¿Por qué lo borrás?» al borrar un animal o una camada que no se adoptó (historia #263). La
-- respuesta se cuenta adentro de la misma transacción que borra (research R2): sin borrado no hay
-- respuesta, y el doble toque termina en `not_found`, que no cuenta. La fila no guarda la persona,
-- el animal ni la hora (R1, Ley 18.331).

-- ---------------------------------------------------------------------------------------------
-- La tabla: la misma lista que DELETION_REASONS en lib/pets/deletion-reason.ts, más `unanswered`
-- ---------------------------------------------------------------------------------------------

create table public.deletion_reasons (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  reason text not null,
  deleted_on date not null default public.uruguay_today(),

  constraint deletion_reasons_kind_valid check (kind in ('pet', 'litter')),
  constraint deletion_reasons_reason_valid check (
    reason in (
      'no_applications',
      'unconvincing_applications',
      'given_elsewhere',
      'not_for_adoption',
      'other',
      'unanswered'
    )
  )
);

comment on table public.deletion_reasons is
  'Por qué se borró un animal o una camada sin adopción, sin la persona, el animal ni la hora (historia #263, FR-024).';

create index deletion_reasons_counts_idx on public.deletion_reasons (kind, reason);

alter table public.deletion_reasons enable row level security;
revoke all on public.deletion_reasons from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Borrar un animal, contando la respuesta (R2, R3)
-- ---------------------------------------------------------------------------------------------

-- `p_reason` nulo: la confirmación no mostró la pregunta. Con una opción o `unanswered`, se cuenta
-- solo si el estado leído con el candado tenía pregunta: un adoptado o dado de baja en otra pestaña
-- se borra como siempre y no cuenta (FR-012).
drop function public.delete_pet(uuid, uuid);

create function public.delete_pet(p_owner uuid, p_pet uuid, p_reason text default null)
returns table (outcome text, code text, from_state text, photo_ids uuid[], reason_counted boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet public.pets%rowtype;
  v_photos uuid[];
  v_from text;
  v_counted boolean := false;
begin
  perform public.lock_phone_account(p_owner);

  select * into v_pet from public.pets p where p.id = p_pet and p.owner_id = p_owner for update;
  if not found then
    return query select 'not_found', null::text, null::text, '{}'::uuid[], false;
    return;
  end if;

  perform private.reject_litter_young(p_pet);

  v_from := private.pet_state(v_pet.status, v_pet.expires_at, v_pet.taken_down_at);
  v_photos := public.pet_photo_ids(p_owner, p_pet);
  delete from public.pets p where p.id = p_pet;

  if p_reason is not null and v_from in ('available', 'in_process', 'paused', 'expired') then
    insert into public.deletion_reasons (kind, reason) values ('pet', p_reason);
    v_counted := true;
  end if;

  return query select 'done', v_pet.code, v_from, v_photos, v_counted;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Borrar una camada, contando la respuesta (R2, R3)
-- ---------------------------------------------------------------------------------------------

-- Las crías primero y la camada después: el cierre de sus solicitudes todavía lee el nombre de la
-- camada. El estado se lee antes de liberar nada: borradas las crías, ya no se sabe si quedaba una
-- sin adoptar. `remove_young` la llama sin `p_reason` al quitar la última cría, y eso no cuenta.
drop function public.delete_litter(uuid, uuid);

create function public.delete_litter(p_owner uuid, p_litter uuid, p_reason text default null)
returns table (outcome text, code text, released uuid[], reason_counted boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_litter public.litters%rowtype;
  v_released uuid[];
  v_asks boolean;
  v_counted boolean := false;
begin
  perform public.lock_phone_account(p_owner);

  select * into v_litter from public.litters l
   where l.id = p_litter and l.owner_id = p_owner
   for update;
  if not found then
    return query select 'not_found', null::text, '{}'::uuid[], false;
    return;
  end if;

  v_asks := private.litter_state(v_litter) not in ('adopted', 'taken_down');

  with freed as (
    update public.pet_photos ph
       set pet_id = null, litter_id = null, position = null, released_at = now()
     where ph.litter_id = p_litter
        or ph.pet_id in (select p.id from public.pets p where p.litter_id = p_litter)
    returning ph.id
  )
  select coalesce(array_agg(f.id), '{}') into v_released from freed f;

  delete from public.pets p where p.litter_id = p_litter;
  delete from public.litters l where l.id = p_litter;

  if p_reason is not null and v_asks then
    insert into public.deletion_reasons (kind, reason) values ('litter', p_reason);
    v_counted := true;
  end if;

  return query select 'done', v_litter.code, v_released, v_counted;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Encuestas, para quien administra (R8): vacía para cualquier otra persona
-- ---------------------------------------------------------------------------------------------

-- Las doce combinaciones de clase y respuesta, también las que están en cero.
create function public.admin_deletion_reason_summary()
returns table (kind text, reason text, total integer)
language sql
stable
security definer
set search_path = ''
as $$
  select k.kind,
         r.reason,
         (select count(*)::integer from public.deletion_reasons d
           where d.kind = k.kind and d.reason = r.reason)
    from (values ('pet', 1), ('litter', 2)) as k (kind, position)
   cross join (
     values ('no_applications', 1), ('unconvincing_applications', 2), ('given_elsewhere', 3),
            ('not_for_adoption', 4), ('other', 5), ('unanswered', 6)
   ) as r (reason, position)
   where private.is_admin()
   order by k.position, r.position;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------

revoke all on function public.delete_pet(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.delete_litter(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_deletion_reason_summary() from public, anon, authenticated;

grant execute on function public.delete_pet(uuid, uuid, text) to service_role;
grant execute on function public.delete_litter(uuid, uuid, text) to service_role;
grant execute on function public.admin_deletion_reason_summary() to authenticated;
