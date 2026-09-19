create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  department text not null,
  locality text not null,
  is_rescuer boolean not null default false,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_display_name_length check (
    char_length(btrim(display_name)) between 2 and 60
  ),
  constraint profiles_locality_length check (
    char_length(btrim(locality)) between 1 and 60
  ),
  -- ISO 3166-2:UY. Los diecinueve no cambian desde 1885; un check dice lo mismo que un enum sin
  -- el costo de migrar un tipo.
  constraint profiles_department_valid check (
    department in (
      'UY-AR', 'UY-CA', 'UY-CL', 'UY-CO', 'UY-DU', 'UY-FS', 'UY-FD', 'UY-LA', 'UY-MA',
      'UY-MO', 'UY-PA', 'UY-RV', 'UY-RO', 'UY-RN', 'UY-SA', 'UY-SJ', 'UY-SO', 'UY-TA', 'UY-TT'
    )
  )
);

comment on table public.profiles is
  'El perfil básico de una persona. El correo no se copia acá: vive en auth.users y duplicarlo '
  'sería guardar dos veces el dato más sensible de la historia #9.';

comment on column public.profiles.avatar_path is
  'Ruta dentro del bucket privado avatars. Nulo es "sin foto": se muestran las iniciales.';

alter table public.profiles enable row level security;

-- En esta historia nadie lee el perfil de otra persona (FR-026a). El perfil público llega en la
-- historia #12 y ahí esta policy se ensancha con una condición explícita; empezar ancha "porque
-- después va a ser pública" sería exponer datos por adelantado.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

-- with check además de using: sin él, alguien podría reasignarle su fila a otra persona.
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
