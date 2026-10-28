// Covers: FR-023, SC-010 (research R9, R16); el origen de la ficha, US3-AS2, US3-AS3, US3-AS4 y
// FR-025 de la #169
import { describe, expect, it } from 'vitest'
import { NO_FILTERS } from '@/lib/pets/listing-query'
import {
  addedFilterOptions,
  addedFromReferer,
  listingViewEvent,
  petViewEvent,
} from './listing-events'

const BROWSER = 'Mozilla/5.0 (Linux; Android 14) Chrome/129.0 Mobile Safari/537.36'
const view = {
  visibility: 'listed' as const,
  isOwner: false,
  referer: null,
  host: 'adopciones.test',
  userAgent: BROWSER,
  marked: false,
  utmSource: null,
  litter: false,
  publisherLevel: null,
}

describe('petViewEvent', () => {
  it('desde el listado del mismo sitio, con o sin filtros', () => {
    for (const referer of [
      'https://adopciones.test/animales',
      'https://adopciones.test/animales?especie=gato&mostrar=48',
    ]) {
      expect(petViewEvent({ ...view, referer })).toEqual({
        name: 'pet_viewed',
        props: { origin: 'listing', litter: false },
      })
    }
  })

  it.each([
    [null, 'unknown'],
    ['no es una dirección', 'unknown'],
    ['https://otro.test/animales', 'unknown'],
    ['https://adopciones.test/mis-animales', 'site'],
    ['https://adopciones.test/animales/k3x9p2qa7m', 'site'],
    ['https://l.facebook.com/l.php?u=x', 'social'],
  ])('desde %s es %s', (referer, origin) => {
    expect(petViewEvent({ ...view, referer })).toEqual({
      name: 'pet_viewed',
      props: { origin, litter: false },
    })
  })

  it('con la marca de Compartir es «compartido»; con el utm_source de un asistente, «asistente»', () => {
    expect(petViewEvent({ ...view, marked: true })).toEqual({
      name: 'pet_viewed',
      props: { origin: 'shared', litter: false },
    })
    expect(petViewEvent({ ...view, utmSource: 'chatgpt.com' })).toEqual({
      name: 'pet_viewed',
      props: { origin: 'assistant', litter: false },
    })
  })

  it('desde la portada del mismo sitio, con o sin query', () => {
    for (const referer of ['https://adopciones.test/', 'https://adopciones.test/?a=1']) {
      expect(petViewEvent({ ...view, referer })).toEqual({
        name: 'pet_viewed',
        props: { origin: 'home', litter: false },
      })
    }
    expect(petViewEvent({ ...view, referer: 'https://otro.test/' })).toEqual({
      name: 'pet_viewed',
      props: { origin: 'unknown', litter: false },
    })
  })

  it('sin host conocido nada es del listado', () => {
    expect(
      petViewEvent({ ...view, host: null, referer: 'https://adopciones.test/animales' }),
    ).toEqual({ name: 'pet_viewed', props: { origin: 'unknown', litter: false } })
  })

  it('oculto, del propio publicador o pedido por un lector de vista previa: nada', () => {
    expect(petViewEvent({ ...view, visibility: 'hidden' })).toBeNull()
    expect(petViewEvent({ ...view, isOwner: true })).toBeNull()
    expect(petViewEvent({ ...view, userAgent: 'WhatsApp/2.23.20.0 A' })).toBeNull()
    expect(petViewEvent({ ...view, marked: true, userAgent: 'facebookexternalhit/1.1' })).toBeNull()
  })

  // Covers: FR-050 de la #205
  it('la ficha de una camada dice que es una camada', () => {
    expect(petViewEvent({ ...view, litter: true })).toEqual({
      name: 'pet_viewed',
      props: { origin: 'unknown', litter: true },
    })
  })

  it('el evento no lleva el código del animal ni la cuenta', () => {
    const event = petViewEvent({ ...view, referer: 'https://adopciones.test/animales' })
    expect(Object.keys(event?.props ?? {})).toEqual(['origin', 'litter'])
  })

  // Covers: US2-AS1, US2-AS4, US2-AS6, US2-AS7 de la #236
  it('lleva el nivel de quien publicó, de un animal o de una camada', () => {
    for (const publisherLevel of [1, 2, 3] as const) {
      expect(petViewEvent({ ...view, publisherLevel })).toEqual({
        name: 'pet_viewed',
        props: { origin: 'unknown', litter: false, publisher_level: publisherLevel },
      })
      expect(petViewEvent({ ...view, publisherLevel, litter: true })).toEqual({
        name: 'pet_viewed',
        props: { origin: 'unknown', litter: true, publisher_level: publisherLevel },
      })
    }
  })

  it('sin el nivel de quien publicó sale sin él, nunca con uno por defecto', () => {
    const event = petViewEvent({ ...view, publisherLevel: null })
    expect(event).toEqual({ name: 'pet_viewed', props: { origin: 'unknown', litter: false } })
    expect(Object.keys(event?.props ?? {})).not.toContain('publisher_level')
  })

  it('con el nivel, lo que hoy no se mide sigue sin medirse', () => {
    expect(petViewEvent({ ...view, publisherLevel: 2, visibility: 'hidden' })).toBeNull()
    expect(petViewEvent({ ...view, publisherLevel: 2, isOwner: true })).toBeNull()
    expect(
      petViewEvent({ ...view, publisherLevel: 2, userAgent: 'WhatsApp/2.23.20.0 A' }),
    ).toBeNull()
  })

  it('con el nivel, ninguna propiedad de más', () => {
    const event = petViewEvent({ ...view, publisherLevel: 3 })
    expect(Object.keys(event?.props ?? {})).toEqual(['origin', 'litter', 'publisher_level'])
  })
})

describe('listingViewEvent', () => {
  const listing = { userAgent: BROWSER, referer: null, host: 'adopciones.test' }

  it('cuenta a una persona y no a un lector de vista previa', () => {
    expect(listingViewEvent(listing)).toEqual({
      name: 'listing_viewed',
      props: { origin: 'elsewhere' },
    })
    expect(
      listingViewEvent({
        ...listing,
        referer: 'https://adopciones.test/',
        userAgent: 'facebookexternalhit/1.1',
      }),
    ).toBeNull()
  })

  it('desde la portada del mismo sitio es «home»', () => {
    expect(listingViewEvent({ ...listing, referer: 'https://adopciones.test/' })).toEqual({
      name: 'listing_viewed',
      props: { origin: 'home' },
    })
  })

  it.each([
    ['https://otro.test/'],
    ['https://adopciones.test/animales'],
    ['https://adopciones.test/animales/k3x9p2qa7m'],
    ['no es una dirección'],
  ])('desde %s es «elsewhere»', (referer) => {
    expect(listingViewEvent({ ...listing, referer })).toEqual({
      name: 'listing_viewed',
      props: { origin: 'elsewhere' },
    })
  })

  it('sin host conocido la portada no cuenta', () => {
    expect(
      listingViewEvent({ ...listing, host: null, referer: 'https://adopciones.test/' }),
    ).toEqual({ name: 'listing_viewed', props: { origin: 'elsewhere' } })
  })
})

describe('addedFilterOptions', () => {
  it('una por cada opción que se sumó, en cualquier filtro', () => {
    const before = { ...NO_FILTERS, species: ['dog' as const] }
    const after = {
      ...NO_FILTERS,
      species: ['dog' as const, 'cat' as const],
      age: ['puppy' as const],
      neutered: ['yes' as const],
    }
    expect(addedFilterOptions(before, after)).toEqual([
      { filter: 'species', option: 'cat' },
      { filter: 'age', option: 'puppy' },
      { filter: 'neutered', option: 'yes' },
    ])
  })

  it('desmarcar o no cambiar no cuenta', () => {
    const before = { ...NO_FILTERS, department: ['UY-CA' as const] }
    expect(addedFilterOptions(before, NO_FILTERS)).toEqual([])
    expect(addedFilterOptions(before, before)).toEqual([])
  })
})

describe('addedFromReferer', () => {
  const cats = { ...NO_FILTERS, species: ['cat' as const], age: ['puppy' as const] }
  const HOST = 'adopciones.test'

  it('desde el listado del sitio, lo que se sumó a lo que tenía', () => {
    expect(addedFromReferer('https://adopciones.test/animales?especie=gato', HOST, cats)).toEqual([
      { filter: 'age', option: 'puppy' },
    ])
    expect(addedFromReferer('https://adopciones.test/animales', HOST, cats)).toEqual([
      { filter: 'species', option: 'cat' },
      { filter: 'age', option: 'puppy' },
    ])
  })

  it('las marcas de «todas» cuentan como las dejó la persona', () => {
    const both = { ...NO_FILTERS, species: ['dog' as const, 'cat' as const] }
    expect(addedFromReferer('https://adopciones.test/animales?especie=perro', HOST, both)).toEqual([
      { filter: 'species', option: 'cat' },
    ])
  })

  it('desde otro lado, o sin referer, nada', () => {
    expect(addedFromReferer(null, HOST, cats)).toEqual([])
    expect(addedFromReferer('https://otro.test/animales', HOST, cats)).toEqual([])
    expect(addedFromReferer('https://adopciones.test/mi-perfil', HOST, cats)).toEqual([])
  })
})
