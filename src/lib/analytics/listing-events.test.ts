// Covers: FR-023, SC-010 (research R9, R16)
import { describe, expect, it } from 'vitest'
import { NO_FILTERS } from '@/lib/pets/listing-query'
import { addedFilterOptions, listingViewEvent, petViewEvent } from './listing-events'

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
  it('cuenta a una persona y no a un lector de vista previa', () => {
    expect(listingViewEvent({ userAgent: BROWSER })).toEqual({ name: 'listing_viewed' })
    expect(listingViewEvent({ userAgent: 'facebookexternalhit/1.1' })).toBeNull()
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
