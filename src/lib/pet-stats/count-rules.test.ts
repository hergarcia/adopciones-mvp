import { describe, expect, it } from 'vitest'
import type { TrackedEvent } from '@/lib/analytics/events'
import { LINK_PREVIEW_AGENTS } from '@/lib/analytics/link-preview'
import { applyCountOf, shouldCountOpen } from './count-rules'

const BROWSER = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1'

// Covers: US1-AS6, US1-AS7, US1-AS8, FR-001, FR-002, FR-003
describe('qué apertura suma', () => {
  it.each(['listed', 'paused', 'expired', 'unavailable', 'blocked'] as const)(
    'la ficha %s, abierta por una persona',
    (kind) => {
      expect(shouldCountOpen({ kind, userAgent: BROWSER })).toBe(true)
    },
  )

  it('sin agente también: no hay nada que diga que no es una persona', () => {
    expect(shouldCountOpen({ kind: 'listed', userAgent: null })).toBe(true)
  })

  it.each(['missing', 'young', 'own_hidden', 'own_listed'] as const)('la ficha %s no', (kind) => {
    expect(shouldCountOpen({ kind, userAgent: BROWSER })).toBe(false)
  })

  it.each([...LINK_PREVIEW_AGENTS, 'Googlebot/2.1'])(
    'la vista previa o el buscador %s no',
    (agent) => {
      expect(shouldCountOpen({ kind: 'listed', userAgent: agent })).toBe(false)
    },
  )
})

const TAPPED: TrackedEvent = {
  name: 'apply_tapped',
  props: { signedIn: true, level: 0, required: 1, litter: false },
}
const stopped = (by: 'phone' | 'identity' | 'limit' | 'not_receiving'): TrackedEvent =>
  by === 'identity'
    ? { name: 'apply_stopped', props: { by, litter: false, hold_offered: false } }
    : { name: 'apply_stopped', props: { by, litter: false } }

// Covers: US1-AS2, US1-AS3, US1-AS4, US1-AS5, FR-004, FR-005, FR-006
describe('qué suma un toque', () => {
  it('sin momentos, nada: recargar no suma', () => {
    expect(applyCountOf([])).toEqual({ tap: false, stop: null })
  })

  it('el toque solo', () => {
    expect(applyCountOf([TAPPED])).toEqual({ tap: true, stop: null })
  })

  it.each(['phone', 'identity'] as const)('el toque y el freno por %s', (by) => {
    expect(applyCountOf([TAPPED, stopped(by)])).toEqual({ tap: true, stop: by })
  })

  it('el freno de la vuelta, sin otro toque: después de entrar o de verificar el teléfono', () => {
    expect(applyCountOf([stopped('identity')])).toEqual({ tap: false, stop: 'identity' })
  })

  it.each(['limit', 'not_receiving'] as const)('%s suma el toque y no un freno', (by) => {
    expect(applyCountOf([TAPPED, stopped(by)])).toEqual({ tap: true, stop: null })
  })

  it('otro momento no suma', () => {
    expect(applyCountOf([{ name: 'application_started', props: { proposed: false } }])).toEqual({
      tap: false,
      stop: null,
    })
  })
})
