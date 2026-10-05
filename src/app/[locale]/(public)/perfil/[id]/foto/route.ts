import { isPublicId } from '@/lib/profile/public-paths'
import { getPublicAvatar } from '@/lib/supabase/queries/avatars'
import { getSessionUser } from '@/lib/supabase/queries/session'

const NOT_FOUND = () => new Response(null, { status: 404 })

// La foto del perfil público por su id público: la ruta de Storage lleva el id de la cuenta, que no
// circula (research R7). Cinco minutos de caché y `private`: ninguna caché compartida la guarda
// después de que se borre la cuenta o se cambie la foto.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isPublicId(id)) return NOT_FOUND()

  // Con quien mira: la foto de una suspendida solo le sale a quien la bloqueó (FR-017a, FR-020).
  const viewer = await getSessionUser()
  const photo = await getPublicAvatar(id, viewer?.id ?? null).catch(() => null)
  if (photo === null) return NOT_FOUND()

  return new Response(photo, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
