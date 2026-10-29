import { getTranslations } from 'next-intl/server'
import { shareLevelText } from '@/components/pets/share-preview-texts'
import { getPetPublisherLevel, getShareCard } from '@/lib/supabase/queries/listed-pets'
import { zoneName } from '@/lib/zones/zone-name'
import { shareImageResponse } from '@/app/[locale]/(public)/_components/share-image-response'

// La imagen de la vista previa de un animal (research R6 de la #57), con el nivel de quien publicó
// (historia #244). Si el nivel no se puede saber, la imagen sale sin él, como antes.
export const runtime = 'nodejs'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ locale: string; code: string }> },
) {
  const { locale, code } = await params
  const [card, level] = await Promise.all([
    getShareCard(code),
    getPetPublisherLevel(code).catch(() => null),
  ])
  if (card === null) return new Response(null, { status: 404 })

  const [t, levelText] = await Promise.all([
    getTranslations({ locale, namespace: 'pets.share' }),
    shareLevelText(level, locale),
  ])
  return shareImageResponse({
    coverUrl: card.coverUrl,
    name: card.name,
    zone: zoneName(card.zone),
    adopted: card.isAdopted ? t('adopted_stamp', { sex: card.sex }) : undefined,
    level: levelText ?? undefined,
  })
}
