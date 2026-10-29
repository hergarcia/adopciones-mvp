// Covers: #240 (cada «Quiero adoptar» y cada freno, una sola vez por toque)
import { describe, expect, it } from 'vitest'
import { applyStoppedEvent, applyTappedEvent } from './application-events'
import { TAP_FLAG, parseTap, tapEvents, tappedApplyPath, withTap } from './apply-tap'

const TAPPED = applyTappedEvent({
  signedIn: true,
  level: 1,
  required: 2,
  litter: false,
  publisherLevel: null,
})
const PHONE = applyStoppedEvent('needs_phone', false)
const IDENTITY = applyStoppedEvent('needs_identity', false)

describe('la marca del toque en la URL', () => {
  it('el botón de la ficha lleva un toque sin contar, también el de una cría', () => {
    expect(TAP_FLAG).toBe('toque')
    expect(tappedApplyPath('/solicitar/semana0001')).toBe('/solicitar/semana0001?toque=nuevo')
    expect(tappedApplyPath('/solicitar/semana0001?camada=camada0001')).toBe(
      '/solicitar/semana0001?camada=camada0001&toque=nuevo',
    )
    expect(parseTap('nuevo')).toEqual({ counted: false, stops: [] })
  })

  it('dice lo que ya se contó y se lee igual del otro lado', () => {
    expect(withTap('/solicitar/a', { counted: true, stops: [] })).toBe('/solicitar/a?toque=contado')
    expect(
      withTap('/solicitar/a?tras=telefono', { counted: true, stops: ['phone', 'identity'] }),
    ).toBe('/solicitar/a?tras=telefono&toque=telefono.identidad')
    expect(withTap('/solicitar/a', { counted: true, stops: ['limit', 'not_receiving'] })).toBe(
      '/solicitar/a?toque=tope.no-recibe',
    )
    expect(parseTap('contado')).toEqual({ counted: true, stops: [] })
    expect(parseTap('telefono')).toEqual({ counted: true, stops: ['phone'] })
    expect(parseTap('telefono.identidad')).toEqual({ counted: true, stops: ['phone', 'identity'] })
    expect(parseTap('tope.no-recibe')).toEqual({ counted: true, stops: ['limit', 'not_receiving'] })
  })

  it('sin marca, o con una que no se entiende, la pantalla no viene de un toque', () => {
    expect(parseTap(undefined)).toBeNull()
    expect(parseTap('')).toBeNull()
    expect(parseTap('1')).toBeNull()
    expect(parseTap('telefono.otra')).toBeNull()
    expect(parseTap('phone')).toBeNull()
  })
})

describe('tapEvents', () => {
  it('sin marca no cuenta nada: recargar, el correo de la identidad, mandar el cuestionario', () => {
    expect(tapEvents(null, TAPPED, IDENTITY)).toEqual({ events: [], next: null })
  })

  it('el toque se cuenta una vez, con su freno si lo hay', () => {
    expect(tapEvents(parseTap('nuevo'), TAPPED, null)).toEqual({
      events: [TAPPED],
      next: { counted: true, stops: [] },
    })
    expect(tapEvents(parseTap('nuevo'), TAPPED, PHONE)).toEqual({
      events: [TAPPED, PHONE],
      next: { counted: true, stops: ['phone'] },
    })
  })

  it('tocado sin sesión, al volver de entrar se cuenta el freno y no otro toque', () => {
    expect(tapEvents(parseTap('contado'), TAPPED, PHONE)).toEqual({
      events: [PHONE],
      next: { counted: true, stops: ['phone'] },
    })
    expect(tapEvents(parseTap('contado'), TAPPED, null)).toEqual({
      events: [],
      next: { counted: true, stops: [] },
    })
  })

  it('después del teléfono, la identidad es otro freno; el mismo freno no suma', () => {
    expect(tapEvents(parseTap('telefono'), TAPPED, IDENTITY)).toEqual({
      events: [IDENTITY],
      next: { counted: true, stops: ['phone', 'identity'] },
    })
    expect(tapEvents(parseTap('telefono'), TAPPED, PHONE)).toEqual({
      events: [],
      next: { counted: true, stops: ['phone'] },
    })
  })

  it('el freno de una cría dice que es de una camada', () => {
    const young = applyStoppedEvent('limit', true)
    expect(tapEvents(parseTap('nuevo'), TAPPED, young).events).toEqual([
      TAPPED,
      { name: 'apply_stopped', props: { by: 'limit', litter: true } },
    ])
  })
})
