import { getTranslations } from 'next-intl/server'
import { getShareCard } from '@/lib/supabase/queries/listed-pets'
import { zoneName } from '@/lib/zones/zone-name'
import { shareImageResponse } from '@/app/[locale]/(public)/_components/share-image-response'

// La imagen de la vista previa de un animal (research R6 de la #57).
export const runtime = 'nodejs'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ locale: string; code: string }> },
) {
  const { locale, code } = await params
  const card = await getShareCard(code)
  if (card === null) return new Response(null, { status: 404 })

  const t = await getTranslations({ locale, namespace: 'pets.share' })
  return shareImageResponse({
    coverUrl: card.coverUrl,
    name: card.name,
    zone: zoneName(card.zone),
    adopted: card.isAdopted ? t('adopted_stamp', { sex: card.sex }) : undefined,
  })
}
