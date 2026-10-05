import { NextResponse, type NextRequest } from 'next/server'
import { trackAll } from '@/lib/analytics/track'
import { parseCursor } from '@/lib/pets/listing-cursor'
import {
  ADDED_KEY,
  CURSOR_KEY,
  parseAddedOptions,
  parseListingQuery,
  queryOf,
} from '@/lib/pets/listing-query'
import { NO_RESPONSE_ERROR } from '@/lib/pets/listing-requests'
import { isLinkPreview } from '@/lib/analytics/link-preview'
import { listingView } from '@/app/[locale]/_components/listing-view'

const NO_STORE = { 'cache-control': 'no-store' }

// Las tandas del listado para el controlador (contracts/routes.md): los mismos filtros de la
// dirección, validados por `parseListingQuery`; con cursor, las siguientes y sin total. Las opciones
// recién marcadas se registran acá, que es donde llega el toque (research R9).
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const { filters, shown } = parseListingQuery(queryOf(params))
  const cursor = parseCursor(params.get(CURSOR_KEY))

  const added = isLinkPreview(request.headers.get('user-agent'))
    ? []
    : parseAddedOptions(params.get(ADDED_KEY))
  await trackAll(added.map((props) => ({ name: 'listing_filter_used', props })))

  try {
    const { total, totalText, ...page } = await listingView(filters, cursor, cursor ? 24 : shown)
    return NextResponse.json(cursor ? page : { ...page, total, totalText }, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ error: NO_RESPONSE_ERROR }, { status: 503, headers: NO_STORE })
  }
}
