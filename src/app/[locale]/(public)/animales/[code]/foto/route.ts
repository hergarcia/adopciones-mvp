import { getShareCard } from '@/lib/supabase/queries/listed-pets'
import { mailPhotoResponse } from '@/app/[locale]/(public)/_components/mail-photo-response'

// La foto del renglón del correo de avisos (#267): con la misma regla que la imagen de compartir,
// se ve mientras se ve la ficha.
export const runtime = 'nodejs'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ locale: string; code: string }> },
) {
  const { code } = await params
  const card = await getShareCard(code, 'thumb')
  return card === null ? new Response(null, { status: 404 }) : mailPhotoResponse(card.coverUrl)
}
