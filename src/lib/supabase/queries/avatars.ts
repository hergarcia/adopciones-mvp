import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'

export const AVATARS_BUCKET = 'avatars'
// Corta para que la imagen cargue y no sirva de enlace. Una firma ya emitida no se puede revocar:
// lo que de verdad corta el acceso es borrar el archivo.
const SIGNED_URL_TTL_SECONDS = 60

// La ruta lleva el id adelante para que la policy pueda compararlo con la sesión.
function avatarPathFor(userId: string): string {
  return `${userId}/avatar.webp`
}

export async function uploadAvatar(userId: string, file: File): Promise<{ path: string } | null> {
  const supabase = await createServerSupabase()
  const path = avatarPathFor(userId)

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { contentType: 'image/webp', upsert: true })

  return error === null ? { path } : null
}

export async function deleteAvatar(userId: string): Promise<void> {
  const supabase = await createServerSupabase()
  await supabase.storage.from(AVATARS_BUCKET).remove([avatarPathFor(userId)])
}

// Con permisos de servicio: corre dentro del borrado de cuenta. Devuelve si salió, y no `void`:
// borrada la persona nadie puede volver a alcanzar esa carpeta —el `on delete cascade` no toca el
// almacenamiento— así que una falla acá dejaría su cara guardada para siempre (FR-026c, FR-028a).
export async function deleteAvatarAsService(userId: string): Promise<{ ok: boolean }> {
  const { error } = await createServiceSupabase()
    .storage.from(AVATARS_BUCKET)
    .remove([avatarPathFor(userId)])

  return { ok: error === null }
}

export async function signAvatarUrl(path: string): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data } = await supabase.storage
    .from(AVATARS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  return data?.signedUrl ?? null
}

// La foto del perfil público, por su id público: la ruta de Storage lleva el id de la cuenta y no
// sale de acá (research R7). Nula sin perfil, sin foto, suspendida —salvo para quien la bloqueó—
// o si no se pudo bajar.
export async function getPublicAvatar(
  publicId: string,
  viewerId: string | null,
): Promise<Blob | null> {
  const service = createServiceSupabase()
  const { data: path, error } = await service.rpc('avatar_path_for', {
    p_public_id: publicId,
    ...(viewerId === null ? {} : { p_viewer: viewerId }),
  })
  if (error || typeof path !== 'string') return null
  const { data } = await service.storage.from(AVATARS_BUCKET).download(path)
  return data ?? null
}

// Las fotos de quienes mandaron solicitudes, para su publicador: la función de la base ya controló
// que las mira el dueño del animal, y la policy del bucket no las alcanza (solo las de quien tiene
// un animal a la vista). Una que no se pudo firmar queda sin foto: se ven las iniciales.
export async function signAvatarsAsService(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map()
  const { data } = await createServiceSupabase()
    .storage.from(AVATARS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)
  return new Map(
    (data ?? []).flatMap((item) =>
      item.path !== null && item.signedUrl ? [[item.path, item.signedUrl] as const] : [],
    ),
  )
}
