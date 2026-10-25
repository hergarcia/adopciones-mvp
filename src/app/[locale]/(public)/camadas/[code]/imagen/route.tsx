import { getLitterShareCard } from '@/lib/supabase/queries/litters'
import { zoneName } from '@/lib/zones/zone-name'
import { shareImageResponse } from '@/app/[locale]/(public)/_components/share-image-response'

// La imagen de la vista previa de una camada (FR-036): su portada, su nombre y su zona.
export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const card = await getLitterShareCard(code)
  if (card === null) return new Response(null, { status: 404 })
  return shareImageResponse({ coverUrl: card.coverUrl, name: card.name, zone: zoneName(card.zone) })
}
