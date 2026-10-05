// Covers: FR-023, SC-010 (research R9, R16)
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
}

describe('petViewEvent', () => {
  it('desde el listado del mismo sitio, con o sin filtros', () => {
    for (const referer of [
      'https://adopciones.test/animales',
      'https://adopciones.test/animales?especie=gato&mostrar=48',
    ]) {
      expect(petViewEvent({ ...view, referer })).toEqual({
        name: 'pet_viewed',
        props: { origin: 'listing' },
      })
    }
  })

  it.each([
    [null],
    ['no es una dirección'],
    ['https://otro.test/animales'],
    ['https://adopciones.test/mis-animales'],
    ['https://adopciones.test/animales/k3x9p2qa7m'],
    ['https://l.facebook.com/l.php?u=x'],
  ])('desde %s es «desde afuera»', (referer) => {
    expect(petViewEvent({ ...view, referer })).toEqual({
      name: 'pet_viewed',
      props: { origin: 'outside' },
    })
  })

  it('desde la portada del mismo sitio, con o sin query', () => {
    for (const referer of ['https://adopciones.test/', 'https://adopciones.test/?a=1']) {
      expect(petViewEvent({ ...view, referer })).toEqual({
        name: 'pet_viewed',
        props: { origin: 'home' },
      })
    }
    expect(petViewEvent({ ...view, referer: 'https://otro.test/' })).toEqual({
      name: 'pet_viewed',
      props: { origin: 'outside' },
    })
  })

  it('sin host conocido nada es del listado', () => {
    expect(
      petViewEvent({ ...view, host: null, referer: 'https://adopciones.test/animales' }),
    ).toEqual({ name: 'pet_viewed', props: { origin: 'outside' } })
  })

  it('oculto, del propio publicador o pedido por un lector de vista previa: nada', () => {
    expect(petViewEvent({ ...view, visibility: 'hidden' })).toBeNull()
    expect(petViewEvent({ ...view, isOwner: true })).toBeNull()
    expect(petViewEvent({ ...view, userAgent: 'WhatsApp/2.23.20.0 A' })).toBeNull()
  })

  it('el evento no lleva el código del animal ni la cuenta', () => {
    const event = petViewEvent({ ...view, referer: 'https://adopciones.test/animales' })
    expect(Object.keys(event?.props ?? {})).toEqual(['origin'])
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
