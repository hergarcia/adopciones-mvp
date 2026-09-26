import { z } from 'zod'
import { getReviewImage } from '@/lib/supabase/queries/review'
import { isIdentityPhotoKind } from '@/lib/verification/identity'

const NOT_FOUND = () => new Response(null, { status: 404 })

// Una imagen de un pedido, leída con la sesión de quien la pide: la policy la deja ver solo a
// quien administra, del pedido vigente y no propio (FR-019, FR-020, FR-029). Todo lo demás es el
// mismo 404 sin cuerpo, así no dice si el pedido existe, de quién es ni si ya se cerró. Nada queda
// guardado en el dispositivo más allá de la pantalla abierta.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const { id, kind } = await params
  if (!z.uuid().safeParse(id).success || !isIdentityPhotoKind(kind)) return NOT_FOUND()

  const image = await getReviewImage(id, kind).catch(() => null)
  if (image === null) return NOT_FOUND()

  return new Response(Buffer.from(image), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
