-- Los límites son los del archivo que se guarda, no los de lo que la pantalla acepta: lo que
-- llega acá ya pasó por el procesado del cliente y es un WebP de 256 px de unos 20 KB. Un bucket
-- que acepta diez megas de cualquier imagen es una carga de archivos abierta con otro nombre.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 262144, array['image/webp'])
on conflict (id) do nothing;

-- La ruta es <id de la persona>/avatar.webp, con el id adelante para que la policy pueda
-- compararlo con la sesión. Es una sola policy `for all` porque hacen falta las cuatro
-- operaciones: sin update, reemplazar la foto falla en silencio (upsert de Storage necesita
-- insert, select y update), y sin delete no se podría quitar (FR-024b).
create policy avatars_own on storage.objects
  for all to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
