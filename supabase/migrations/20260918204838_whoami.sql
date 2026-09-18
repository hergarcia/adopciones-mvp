-- Único objeto de base que crea F00, y no es del producto: el arnés de privacidad necesita
-- preguntarle a la base quién es la sesión actual, y la API de datos expone tablas y funciones,
-- no expresiones sueltas. Sin esto no hay forma de confirmar la identidad de cada rol.
--
-- security invoker a propósito: una función definer correría con los privilegios de quien la creó
-- y saltearía RLS, que es exactamente lo que el arnés existe para poder probar.

create or replace function public.whoami()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid();
$$;

comment on function public.whoami() is
  'Devuelve el identificador de la sesión actual, o null sin sesión. Herramienta del arnés de '
  'pruebas de privacidad (F00); no es parte del producto.';

revoke all on function public.whoami() from public;
grant execute on function public.whoami() to anon, authenticated, service_role;
