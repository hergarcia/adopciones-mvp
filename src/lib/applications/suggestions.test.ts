// Covers: historia #259, criterios 1, 3 y 5. Si los sugeridos salen después de retirar o de un
// bloqueo, el sitio empuja a seguir pidiendo a quien no corresponde; si no salen después de un no, la
// persona vuelve al grupo.
import { describe, expect, it } from 'vitest'
import { offersSuggestions, suggestionHref, suggestionsListingHref } from './suggestions'
import { CLOSE_REASONS, type ApplicationStatus, type CloseReason } from './types'

describe('offersSuggestions', () => {
  it('no aceptada, también con la aceptación dejada sin efecto, ofrece', () => {
    expect(offersSuggestions({ status: 'rejected', closeReason: null })).toBe(true)
  })

  it.each<CloseReason>(['adopted', 'unpublished', 'not_receiving'])(
    'cerrada por %s ofrece',
    (closeReason) => {
      expect(offersSuggestions({ status: 'closed', closeReason })).toBe(true)
    },
  )

  it.each<CloseReason>(['you_blocked', 'suspended', 'handed_over'])(
    'cerrada por %s no ofrece',
    (closeReason) => {
      expect(offersSuggestions({ status: 'closed', closeReason })).toBe(false)
    },
  )

  it.each<ApplicationStatus>(['sent', 'accepted', 'withdrawn'])('%s no ofrece', (status) => {
    expect(offersSuggestions({ status, closeReason: null })).toBe(false)
  })

  it('cerrada sin motivo no ofrece', () => {
    expect(offersSuggestions({ status: 'closed', closeReason: null })).toBe(false)
  })

  it('el motivo solo cuenta en una cerrada', () => {
    for (const closeReason of CLOSE_REASONS)
      expect(offersSuggestions({ status: 'withdrawn', closeReason })).toBe(false)
  })
})

describe('los enlaces de los sugeridos', () => {
  it('la ficha lleva la marca del sugerido y nada de la persona', () => {
    expect(suggestionHref('/animales/k3x9p2qa7m')).toBe('/animales/k3x9p2qa7m?desde=sugerido')
    expect(suggestionHref('/camadas/k3x9p2qa7m')).toBe('/camadas/k3x9p2qa7m?desde=sugerido')
  })

  it('el listado llega con la especie y el departamento filtrados', () => {
    expect(suggestionsListingHref('dog', 'UY-MO')).toBe(
      '/animales?especie=perro&departamento=montevideo',
    )
    expect(suggestionsListingHref('cat', 'UY-TT')).toBe(
      '/animales?especie=gato&departamento=treinta-y-tres',
    )
  })
})
