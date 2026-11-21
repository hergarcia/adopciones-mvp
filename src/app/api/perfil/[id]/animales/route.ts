import { NextResponse, type NextRequest } from 'next/server'
import { parseCursor } from '@/lib/pets/listing-cursor'
import { CURSOR_KEY } from '@/lib/pets/listing-query'
import { NO_RESPONSE_ERROR } from '@/lib/pets/listing-requests'
import { LISTING_PAGE_SIZE } from '@/lib/pets/rules'
import { isPublicId } from '@/lib/profile/public-paths'
import { profilePetsView } from '@/app/[locale]/_components/listing-view'

const NO_STORE = { 'cache-control': 'no-store' }

// Las tandas de «En adopción» del perfil (contracts/routes.md): sin cursor, la primera, para «Probar
// de nuevo»; con cursor, «Ver más». No mide nada: la visita ya la midió la página (FR-022).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isPublicId(id)) {
    return NextResponse.json(
      { cards: [], next: null, signedAt: new Date().toISOString() },
      { headers: NO_STORE },
    )
  }
  const cursor = parseCursor(request.nextUrl.searchParams.get(CURSOR_KEY))
  try {
    const page = await profilePetsView(id, cursor, LISTING_PAGE_SIZE)
    return NextResponse.json(page, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ error: NO_RESPONSE_ERROR }, { status: 503, headers: NO_STORE })
  }
}
