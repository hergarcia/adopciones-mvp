// Covers: FR-015, FR-016, FR-017a, US3-AS9 y Pantallas «Cambios seguidos» (research R4). Lo que hace
// el hook `useListingPages` vive acá: pedir la tanda, abortar la anterior y decir por qué falló.
import { describe, expect, it, vi } from 'vitest'
import { NO_FILTERS, type ListingFilters } from './listing-query'
import { readFileSync } from 'node:fs'
import {
  NO_RESPONSE_ERROR,
  isApiPage,
  listingApiHref,
  listingRequester,
  type ApiPage,
} from './listing-requests'

const filters = (partial: Partial<ListingFilters>): ListingFilters => ({
  ...NO_FILTERS,
  ...partial,
})

describe('listingApiHref', () => {
  const cats = filters({ species: ['cat'], age: ['puppy'] })

  it('sin nada más, los filtros de la dirección', () => {
    expect(listingApiHref(NO_FILTERS)).toBe('/api/animales')
    expect(listingApiHref(cats)).toBe('/api/animales?especie=gato&edad=cachorro')
    expect(listingApiHref(NO_FILTERS, { shown: 72 })).toBe('/api/animales?mostrar=72')
  })

  it('el cursor va codificado, y las opciones sumadas al final', () => {
    const cursor = '2026-09-28T14:06:44.200492+00:00~k3x9p2qa7m'
    const href = listingApiHref(cats, {
      cursor,
      added: [{ filter: 'species', option: 'cat' }],
    })
    expect(href).toBe(
      '/api/animales?especie=gato&edad=cachorro&despues=2026-09-28T14%3A06%3A44.200492%2B00%3A00~k3x9p2qa7m&sumadas=especie.gato',
    )
    expect(new URL(href, 'http://sitio').searchParams.get('despues')).toBe(cursor)
    expect(listingApiHref(NO_FILTERS, { cursor })).toBe(
      `/api/animales?despues=${encodeURIComponent(cursor)}`,
    )
  })
})

const CARD = {
  key: 'k3x9p2qa7m',
  href: '/animales/k3x9p2qa7m',
  name: 'Luna',
  ageText: '2 años',
  zoneText: 'Pocitos, Montevideo',
  urgentText: null,
  alt: 'Foto de Luna, perra en Pocitos, Montevideo',
  photo: { src: 'https://x/card.webp', placeholder: null, width: 1280, height: 1600 },
}
const PAGE: ApiPage = { cards: [CARD], next: null, signedAt: '2026-09-28T12:00:00.000Z' }

describe('isApiPage', () => {
  it('reconoce una tanda, con o sin cursor y total', () => {
    expect(isApiPage(PAGE)).toBe(true)
    expect(isApiPage({ ...PAGE, next: 'c', total: 3, totalText: '3 animales' })).toBe(true)
    expect(isApiPage({ ...PAGE, cards: [] })).toBe(true)
  })

  it.each([
    ['nada', null],
    ['un texto', 'hola'],
    ['sin cards', { next: null, signedAt: 'x' }],
    ['cards que no son lista', { ...PAGE, cards: 'x' }],
    ['un cursor raro', { ...PAGE, next: 3 }],
    ['sin cursor', { cards: [], signedAt: 'x' }],
    ['sin la hora de la firma', { cards: [], next: null }],
    ['una card sin foto', { ...PAGE, cards: [{ ...CARD, photo: null }] }],
    ['una card con una foto que es un texto', { ...PAGE, cards: [{ ...CARD, photo: 'x' }] }],
    ['una card con una foto sin fuente', { ...PAGE, cards: [{ ...CARD, photo: {} }] }],
    ['una card sin nombre', { ...PAGE, cards: [{ ...CARD, name: 1 }] }],
    ['una card sin enlace', { ...PAGE, cards: [{ ...CARD, href: undefined }] }],
    ['una card nula', { ...PAGE, cards: [null] }],
    ['una card que es un texto', { ...PAGE, cards: ['Luna'] }],
  ])('%s no lo es', (_, value) => {
    expect(isApiPage(value)).toBe(false)
  })
})

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

describe('listingRequester', () => {
  it('trae la tanda', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => respond(PAGE))
    const request = listingRequester(fetcher)
    expect(await request('/api/animales')).toEqual({ kind: 'loaded', page: PAGE })
    expect(fetcher).toHaveBeenCalledWith('/api/animales', expect.objectContaining({}))
  })

  it('un pedido nuevo aborta el anterior, y lo que llega del abortado no se usa', async () => {
    const signals: AbortSignal[] = []
    let release = () => {}
    const fetcher = vi.fn<typeof fetch>(async (_, init) => {
      if (init?.signal) signals.push(init.signal)
      if (signals.length === 1) await new Promise<void>((resolve) => (release = resolve))
      return respond(PAGE)
    })
    const request = listingRequester(fetcher)
    const first = request('/api/animales?especie=perro')
    const second = await request('/api/animales?especie=gato')
    release()
    expect(signals[0].aborted).toBe(true)
    expect(signals[1].aborted).toBe(false)
    expect(await first).toEqual({ kind: 'aborted' })
    expect(second).toEqual({ kind: 'loaded', page: PAGE })
  })

  it('si el pedido no llega a responder, es la conexión', async () => {
    const request = listingRequester(async () => Promise.reject(new TypeError('Failed to fetch')))
    expect(await request('/api/animales')).toEqual({ kind: 'failed', reason: 'offline' })
  })

  it('un 503 o una respuesta rara es que el sitio no respondió', async () => {
    const down = listingRequester(async () => respond({ error: 'x' }, 503))
    expect(await down('/api/animales')).toEqual({ kind: 'failed', reason: 'no_response' })
    const odd = listingRequester(async () => respond({ nada: true }))
    expect(await odd('/api/animales')).toEqual({ kind: 'failed', reason: 'no_response' })
  })

  it('una falla de un pedido abortado tampoco se usa', async () => {
    const failures: ((error: Error) => void)[] = []
    const request = listingRequester(
      async () => new Promise<Response>((_, reject) => failures.push(reject)),
    )
    const first = request('/api/animales')
    void request('/api/animales?especie=gato')
    failures[0](new Error('abortado'))
    expect(await first).toEqual({ kind: 'aborted' })
  })
})

describe('NO_RESPONSE_ERROR', () => {
  it('es la clave de i18n de «El sitio no respondió.»', () => {
    const messages: unknown = JSON.parse(readFileSync('messages/es.json', 'utf8'))
    const path = NO_RESPONSE_ERROR.split('.')
    const text: unknown = path.reduce<unknown>(
      (node, key) => (typeof node === 'object' && node !== null ? Reflect.get(node, key) : null),
      messages,
    )
    expect(path[path.length - 1]).toBe('no_response')
    expect(text).toBe('El sitio no respondió.')
  })
})
