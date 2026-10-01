import {
  ADDED_KEY,
  CURSOR_KEY,
  formatAddedOptions,
  listingSearch,
  type AddedOption,
  type ListingFilters,
} from './listing-query'
import { LISTING_PAGE_SIZE } from './rules'
import type { ListedCardView } from './types'

export const LISTING_API_PATH = '/api/animales'

type ApiRequest = { shown?: number; cursor?: string | null; added?: AddedOption[] }

// Lo que pide el controlador: los mismos filtros de la dirección, y el cursor de «Ver más» o las
// opciones recién marcadas para la medición. El cursor lleva la zona con `+`: va codificado.
export function listingApiHref(filters: ListingFilters, request: ApiRequest = {}): string {
  const { shown = LISTING_PAGE_SIZE, cursor = null, added = [] } = request
  const parts = [listingSearch(filters, shown)]
  if (cursor !== null) parts.push(`${CURSOR_KEY}=${encodeURIComponent(cursor)}`)
  if (added.length > 0) parts.push(`${ADDED_KEY}=${formatAddedOptions(added)}`)
  const search = parts.filter((part) => part !== '').join('&')
  return search === '' ? LISTING_API_PATH : `${LISTING_API_PATH}?${search}`
}

/** Una tanda como la devuelve `GET /api/animales` (contracts/routes.md). */
export type ApiPage = {
  cards: ListedCardView[]
  next: string | null
  /** Solo sin cursor: con «Ver más» el total no cambia (FR-015). */
  total?: number
  totalText?: string
  signedAt: string
}

export type ListingFailure = 'offline' | 'no_response'

/** Lo que responde la ruta de tandas si la base falla: la clave de i18n, como una acción. */
export const NO_RESPONSE_ERROR = 'pets.listing.errors.no_response'

export type RequestResult =
  | { kind: 'loaded'; page: ApiPage }
  | { kind: 'failed'; reason: ListingFailure }
  | { kind: 'aborted' }

const has = (value: object, key: string, type: string) => typeof Reflect.get(value, key) === type

function isCardView(value: unknown): value is ListedCardView {
  if (typeof value !== 'object' || value === null) return false
  const photo: unknown = Reflect.get(value, 'photo')
  return (
    ['key', 'href', 'name', 'zoneText', 'alt'].every((key) => has(value, key, 'string')) &&
    typeof photo === 'object' &&
    photo !== null &&
    has(photo, 'src', 'string')
  )
}

// La respuesta es nuestra, pero llega por la red: se mira su forma antes de pintarla.
export function isApiPage(value: unknown): value is ApiPage {
  if (typeof value !== 'object' || value === null) return false
  const next: unknown = Reflect.get(value, 'next')
  const cards: unknown = Reflect.get(value, 'cards')
  return (
    Array.isArray(cards) &&
    cards.every(isCardView) &&
    (next === null || typeof next === 'string') &&
    has(value, 'signedAt', 'string')
  )
}

// Un solo pedido a la vez (research R4): uno nuevo aborta el anterior, y lo que llega de uno abortado
// no se usa. Si el pedido no llega a responder es la conexión; si responde mal, el sitio.
export function listingRequester(fetcher: typeof fetch) {
  let current: AbortController | null = null

  return async function request(href: string): Promise<RequestResult> {
    current?.abort()
    const controller = new AbortController()
    current = controller
    const settled = (result: RequestResult): RequestResult =>
      controller.signal.aborted ? { kind: 'aborted' } : result
    try {
      const response = await fetcher(href, { signal: controller.signal })
      const body: unknown = response.ok ? await response.json() : null
      return settled(
        isApiPage(body)
          ? { kind: 'loaded', page: body }
          : { kind: 'failed', reason: 'no_response' },
      )
    } catch {
      return settled({ kind: 'failed', reason: 'offline' })
    }
  }
}
