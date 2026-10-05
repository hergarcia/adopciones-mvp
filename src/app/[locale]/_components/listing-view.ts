import { listedCardViews, listingTotalText } from '@/components/pets/listing-texts'
import type { ListingCursor } from '@/lib/pets/listing-cursor'
import { nextCursor } from '@/lib/pets/listing-page'
import type { ListingFilters } from '@/lib/pets/listing-query'
import type { ApiPage } from '@/lib/pets/listing-requests'
import { listListedPets } from '@/lib/supabase/queries/listed-pets'

// Una tanda del listado con las cards ya armadas: la usan la página, para la primera vista, y la
// ruta de tandas. Se pide una de más para saber si queda «Ver más». Si la base falla, lanza.
export async function listingView(
  filters: ListingFilters,
  cursor: ListingCursor | null,
  shown: number,
): Promise<ApiPage & { total: number; totalText: string }> {
  const page = await listListedPets(filters, cursor, shown + 1)
  const [cards, totalText] = await Promise.all([
    listedCardViews(page.pets.slice(0, shown)),
    listingTotalText(page.total),
  ])
  return {
    cards,
    next: nextCursor(page.pets, shown),
    total: page.total,
    totalText,
    signedAt: page.signedAt,
  }
}
