import { describe, expect, it } from 'vitest'
import {
  EMPTY_FAILURE_LOG,
  SAVE_DEADLINE_MS,
  classifySaveFailure,
  recordFailure,
} from './save-failure'

const data = { redirectTo: '/mi-perfil', wasComplete: false }

function failed(error: string) {
  return { kind: 'result' as const, result: { ok: false as const, error } }
}

// Covers: US1-AS1, US1-AS3, US1-AS4 (FR-002, FR-003, FR-006, FR-008)
describe('qué se le dice a la persona según cómo terminó el guardado', () => {
  it('un guardado que salió es un guardado, con o sin red', () => {
    const outcome = { kind: 'result' as const, result: { ok: true as const, data } }
    expect(classifySaveFailure({ online: true, outcome })).toEqual({ kind: 'saved', data })
    expect(classifySaveFailure({ online: false, outcome })).toEqual({ kind: 'saved', data })
  })

  it('sin sesión pide volver a entrar, no habla de la conexión', () => {
    expect(
      classifySaveFailure({ online: true, outcome: failed('profile.errors.session') }),
    ).toEqual({ kind: 'notice', reason: 'session' })
  })

  it('el sitio contestó que no pudo guardar: «el sitio no respondió»', () => {
    expect(
      classifySaveFailure({ online: true, outcome: failed('profile.errors.save_failed') }),
    ).toEqual({ kind: 'notice', reason: 'no_response' })
  })

  it('un dato rechazado sigue siendo un dato rechazado, aunque no haya red', () => {
    expect(
      classifySaveFailure({ online: false, outcome: failed('profile.errors.photo_failed') }),
    ).toEqual({ kind: 'invalid', error: 'profile.errors.photo_failed' })
    expect(
      classifySaveFailure({ online: true, outcome: failed('profile.errors.name_required') }),
    ).toEqual({ kind: 'invalid', error: 'profile.errors.name_required' })
  })

  it('el pedido no llegó y el dispositivo no tiene red: «sin conexión»', () => {
    expect(classifySaveFailure({ online: false, outcome: { kind: 'threw' } })).toEqual({
      kind: 'notice',
      reason: 'offline',
    })
  })

  it('el pedido no llegó pero el dispositivo dice tener red: «el sitio no respondió»', () => {
    expect(classifySaveFailure({ online: true, outcome: { kind: 'threw' } })).toEqual({
      kind: 'notice',
      reason: 'no_response',
    })
  })

  it('vencido el plazo es «el sitio no respondió», haya red o no', () => {
    expect(classifySaveFailure({ online: true, outcome: { kind: 'timeout' } })).toEqual({
      kind: 'notice',
      reason: 'no_response',
    })
    expect(classifySaveFailure({ online: false, outcome: { kind: 'timeout' } })).toEqual({
      kind: 'notice',
      reason: 'no_response',
    })
  })

  it('el plazo es de treinta segundos (SC-003)', () => {
    expect(SAVE_DEADLINE_MS).toBe(30_000)
  })
})

// Covers: US4-AS1, US4-AS3 (FR-019, SC-006)
describe('los fallos de una visita a la pantalla', () => {
  it('arranca sin fallos', () => {
    expect(EMPTY_FAILURE_LOG).toEqual({ seen: 0, pending: [] })
  })

  it('cada toque que no llegó se anota, y solo el primero dice que es el primero', () => {
    const once = recordFailure(EMPTY_FAILURE_LOG, 'offline', 'create')
    expect(once).toEqual({
      seen: 1,
      pending: [{ reason: 'offline', moment: 'create', first: true }],
    })

    const twice = recordFailure(once, 'no_response', 'create')
    expect(twice).toEqual({
      seen: 2,
      pending: [
        { reason: 'offline', moment: 'create', first: true },
        { reason: 'no_response', moment: 'create', first: false },
      ],
    })
  })

  it('después de anotar, el siguiente sigue sin ser el primero', () => {
    const reported = { seen: 1, pending: [] }
    expect(recordFailure(reported, 'offline', 'edit')).toEqual({
      seen: 2,
      pending: [{ reason: 'offline', moment: 'edit', first: false }],
    })
  })

  it('una sesión cerrada no es un fallo de conexión y no se anota', () => {
    expect(recordFailure(EMPTY_FAILURE_LOG, 'session', 'create')).toBe(EMPTY_FAILURE_LOG)
  })
})
