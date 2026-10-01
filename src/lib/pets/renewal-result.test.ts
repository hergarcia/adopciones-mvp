// Covers: FR-018, FR-019, FR-020, US3-AS1, US3-AS3, US3-AS4, US3-AS5, US3-AS7, US3-AS8, US3-AS10
// (la pantalla de resultado de «Sigue disponible»: cada caso con su título, cuerpo y acción)
import { describe, expect, it } from 'vitest'
import { renewalResult, type RenewalPet } from './renewal-result'
import type { PetState } from './types'

const EXPIRES = new Date('2026-10-31T15:00:00.000Z')

function pet(state: PetState, expiresAt: Date | null = EXPIRES): RenewalPet {
  return { name: 'Tobi', sex: 'male', state, expiresAt }
}

const NAMED = { name: 'Tobi', sex: 'male' }

describe('renewalResult', () => {
  it.each(['available', 'in_process'] as const)(
    'renovado (%s): hasta qué día sigue publicado, y Mis animales',
    (state) => {
      expect(renewalResult('renewed', pet(state))).toEqual({
        title: 'renewed.title',
        body: 'renewed.body',
        values: { ...NAMED, date: EXPIRES },
        action: 'my_pets',
      })
    },
  )

  it('vuelto a publicar: que volvió al listado y hasta cuándo', () => {
    expect(renewalResult('republished', pet('available'))).toEqual({
      title: 'republished.title',
      body: 'republished.body',
      values: { ...NAMED, date: EXPIRES },
      action: 'my_pets',
    })
  })

  it.each(['paused', 'adopted', 'taken_down'] as const)(
    '%s: nada cambió, dice cómo está y lleva a Mis animales',
    (state) => {
      expect(renewalResult(state, pet(state, null))).toEqual({
        title: `${state}.title`,
        body: `${state}.body`,
        values: NAMED,
        action: 'my_pets',
      })
    },
  )

  it('lo dice el animal como está ahora, aunque la ruta diga que se renovó', () => {
    expect(renewalResult('renewed', pet('adopted', null)).title).toBe('adopted.title')
    expect(renewalResult('needs_verification', pet('paused', null)).title).toBe('paused.title')
  })

  it.each(['available', 'expired'] as const)(
    'sin el teléfono confirmado (%s): primero confirmarlo',
    (state) => {
      expect(renewalResult('needs_verification', pet(state))).toEqual({
        title: 'needs_verification.title',
        body: 'needs_verification.body',
        values: NAMED,
        action: 'verify',
      })
    },
  )

  it('el enlace no sirve: sin el nombre de nadie, y Mis animales', () => {
    for (const asked of ['invalid', 'renewed', 'preview', undefined]) {
      expect(renewalResult(asked, null)).toEqual({
        title: 'invalid.title',
        body: 'invalid.body',
        values: {},
        action: 'my_pets',
      })
    }
  })

  it('el sitio no respondió: no dice que el enlace no sirve, y ofrece reintentar', () => {
    expect(renewalResult('error', pet('available'))).toEqual({
      title: 'error.title',
      body: 'error.body',
      values: NAMED,
      action: 'retry',
    })
    expect(renewalResult('error', null)).toEqual({
      title: 'error.title_unnamed',
      body: 'error.body',
      values: {},
      action: 'retry',
    })
  })

  it.each([
    ['una vista previa', 'preview', pet('available')],
    ['sin resultado', undefined, pet('in_process')],
    ['un resultado inventado', 'otra-cosa', pet('available')],
    ['renovado pero ya vencido', 'renewed', pet('expired')],
    ['vuelto a publicar pero ya vencido', 'republished', pet('expired')],
    ['renovado sin fecha', 'renewed', pet('available', null)],
    ['pausado y después reanudado', 'paused', pet('available')],
  ])('%s: ofrece renovar, sin decir que se renovó', (_, asked, current) => {
    expect(renewalResult(asked, current)).toEqual({
      title: 'confirm.title',
      body: 'confirm.body',
      values: NAMED,
      action: 'renew',
    })
  })
})
