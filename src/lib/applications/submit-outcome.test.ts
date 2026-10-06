// Covers: FR-014, FR-030, FR-031, US1-AS11, US1-AS13 (cada resultado del envío a su clave y destino)
import { describe, expect, it } from 'vitest'
import { submitOutcome } from './submit-outcome'

const CODE = 'semana0001'

describe('submitOutcome', () => {
  it('enviada, o el mismo intento que ya había llegado: la solicitud', () => {
    expect(submitOutcome({ outcome: 'sent', id: 's1' }, CODE)).toEqual({
      ok: true,
      data: { id: 's1' },
    })
    expect(submitOutcome({ outcome: 'already', id: 's2' }, CODE)).toEqual({
      ok: true,
      data: { id: 's2' },
    })
  })

  it('sin respuesta de la base, o enviada sin id, no se mandó', () => {
    const failed = { ok: false, error: 'applications.errors.failed' }
    expect(submitOutcome(null, CODE)).toEqual(failed)
    expect(submitOutcome({ outcome: 'sent', id: null }, CODE)).toEqual(failed)
    expect(submitOutcome({ outcome: 'already', id: null }, CODE)).toEqual(failed)
    expect(submitOutcome({ outcome: 'has_active', id: null }, CODE)).toEqual(failed)
  })

  it('ya tiene una activa por ese animal: se queda, con su solicitud', () => {
    expect(submitOutcome({ outcome: 'has_active', id: 'a1' }, CODE)).toEqual({
      ok: false,
      error: 'applications.errors.has_active',
      detail: { id: 'a1' },
    })
  })

  it('el límite, no disponible por ahora y no recibe: se queda con el motivo', () => {
    for (const outcome of ['limit', 'unavailable', 'not_receiving'] as const) {
      expect(submitOutcome({ outcome, id: null }, CODE)).toEqual({
        ok: false,
        error: `applications.errors.${outcome}`,
      })
    }
  })

  it('un animal que se borró mientras contestaba ya no recibe solicitudes', () => {
    expect(submitOutcome({ outcome: 'not_found', id: null }, CODE)).toEqual({
      ok: false,
      error: 'applications.errors.not_receiving',
    })
  })

  it('sin teléfono: al aviso de verificación, con la vuelta marcada y el origen en la ficha', () => {
    expect(submitOutcome({ outcome: 'needs_phone', id: null }, CODE)).toEqual({
      ok: false,
      error: 'applications.errors.needs_phone',
      detail: {
        redirect:
          '/verificar-telefono?para=solicitar&next=%2Fsolicitar%2Fsemana0001%3Ftras%3Dtelefono&desde=%2Fanimales%2Fsemana0001',
      },
    })
  })

  it('sin la identidad que pide: a la pantalla de identidad del animal', () => {
    expect(submitOutcome({ outcome: 'needs_identity', id: null }, CODE)).toEqual({
      ok: false,
      error: 'applications.errors.needs_identity',
      detail: { redirect: '/solicitar/semana0001' },
    })
  })

  it('propio, o de alguien que bloqueó: a la ficha', () => {
    for (const outcome of ['own', 'you_blocked'] as const) {
      expect(submitOutcome({ outcome, id: null }, CODE)).toEqual({
        ok: false,
        error: 'applications.errors.not_receiving',
        detail: { redirect: '/animales/semana0001' },
      })
    }
  })

  it('respuestas que la base no acepta: no se mandó', () => {
    expect(submitOutcome({ outcome: 'answers_invalid', id: null }, CODE)).toEqual({
      ok: false,
      error: 'applications.errors.failed',
    })
  })
})
