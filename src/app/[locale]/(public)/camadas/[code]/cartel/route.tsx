import { litterPosterCard } from '@/components/pets/poster-texts'
import { offersLitterGroupPost } from '@/lib/share/group-post'
import { getLitterByCode } from '@/lib/supabase/queries/litters'
import { posterResponse } from '@/app/[locale]/(public)/_components/poster-response'

// El cartel de una camada (historia #275): solo para quien la publicó y mientras alguna cría recibe
// solicitudes, como la acción que lo pide; para cualquier otro, no existe.
export const runtime = 'nodejs'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ locale: string; code: string }> },
) {
  const { locale, code } = await params
  const litter = await getLitterByCode(code)
  if (litter === null || !('code' in litter) || !offersLitterGroupPost(litter)) {
    return new Response(null, { status: 404 })
  }
  const cover = litter.photos.at(0)
  if (cover === undefined) return new Response(null, { status: 404 })
  return posterResponse(await litterPosterCard(litter, locale), cover.urls.full)
}
