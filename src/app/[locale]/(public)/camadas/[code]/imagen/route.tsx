import { getTranslations } from 'next-intl/server'
import { shareImageLevel } from '@/components/pets/share-preview-texts'
import { getLitterPublisherLevel, getLitterShareCard } from '@/lib/supabase/queries/litters'
import { zoneName } from '@/lib/zones/zone-name'
import { shareImageResponse } from '@/app/[locale]/(public)/_components/share-image-response'

// La imagen de la vista previa de una camada (FR-036): su portada, su nombre, su zona y el nivel de
// quien publicó, como la de un animal; adoptada entera, el sello en lugar de la zona (#206, FR-020).
export const runtime = 'nodejs'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ locale: string; code: string }> },
) {
  const { locale, code } = await params
  const [card, level] = await Promise.all([
    getLitterShareCard(code),
    getLitterPublisherLevel(code).catch(() => null),
  ])
  if (card === null) return new Response(null, { status: 404 })
  const [t, publisherLevel] = await Promise.all([
    getTranslations({ locale, namespace: 'pets.share' }),
    shareImageLevel(level, locale),
  ])
  return shareImageResponse({
    coverUrl: card.coverUrl,
    name: card.name,
    zone: zoneName(card.zone),
    adopted: card.isAdopted ? t('adopted_stamp', { sex: 'female' }) : undefined,
    level: publisherLevel ?? undefined,
  })
}
