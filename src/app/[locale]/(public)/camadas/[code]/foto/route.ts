import { getLitterShareCard } from '@/lib/supabase/queries/litters'
import { mailPhotoResponse } from '@/app/[locale]/(public)/_components/mail-photo-response'

// La foto del renglón del correo de avisos (#267), como la de un animal: se ve mientras se ve la
// camada.
export const runtime = 'nodejs'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ locale: string; code: string }> },
) {
  const { code } = await params
  const card = await getLitterShareCard(code, 'thumb')
  return card === null ? new Response(null, { status: 404 }) : mailPhotoResponse(card.coverUrl)
}
