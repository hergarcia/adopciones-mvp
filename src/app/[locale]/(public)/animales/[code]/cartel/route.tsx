import { petPosterCard } from '@/components/pets/poster-texts'
import { offersPetGroupPost } from '@/lib/share/group-post'
import { getPublicPet } from '@/lib/supabase/queries/listed-pets'
import { posterResponse } from '@/app/[locale]/(public)/_components/poster-response'

// El cartel de un animal (historia #275): solo para quien lo publicó y mientras recibe solicitudes,
// como la acción que lo pide; para cualquier otro, no existe.
export const runtime = 'nodejs'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ locale: string; code: string }> },
) {
  const { locale, code } = await params
  const pet = await getPublicPet(code)
  if (pet === null || !('code' in pet) || !offersPetGroupPost(pet)) {
    return new Response(null, { status: 404 })
  }
  const cover = pet.photos.at(0)
  if (cover === undefined) return new Response(null, { status: 404 })
  return posterResponse(await petPosterCard(pet, locale), cover.urls.full)
}
