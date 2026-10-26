import { getTranslations } from 'next-intl/server'
import { getLitterShareCard } from '@/lib/supabase/queries/litters'
import { zoneName } from '@/lib/zones/zone-name'
import { shareImageResponse } from '@/app/[locale]/(public)/_components/share-image-response'

// La imagen de la vista previa de una camada (FR-036): su portada, su nombre y su zona; adoptada
// entera, el sello en lugar de la zona, como un animal adoptado (#206, FR-020).
export const runtime = 'nodejs'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ locale: string; code: string }> },
) {
  const { locale, code } = await params
  const card = await getLitterShareCard(code)
  if (card === null) return new Response(null, { status: 404 })
  const t = await getTranslations({ locale, namespace: 'pets.share' })
  return shareImageResponse({
    coverUrl: card.coverUrl,
    name: card.name,
    zone: zoneName(card.zone),
    adopted: card.isAdopted ? t('adopted_stamp', { sex: 'female' }) : undefined,
  })
}
