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
