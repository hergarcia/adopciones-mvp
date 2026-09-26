import { describe, expect, it } from 'vitest'
import { PROFILE_SAVE_REPORT_MAX, profileSaveReportSchema } from './profile-save-report'

const failure = { reason: 'offline', moment: 'create', first: true }

function accepts(payload: unknown) {
  return profileSaveReportSchema.safeParse(payload).success
}

// Covers: US4-AS1, US4-AS3 (FR-019, FR-022)
describe('el reporte de guardados del perfil que fallaron', () => {
  it('acepta cada motivo y cada momento, primero o no', () => {
    expect(
      accepts({
        failures: [
          failure,
          { reason: 'no_response', moment: 'edit', first: false },
          { reason: 'offline', moment: 'edit', first: false },
          { reason: 'no_response', moment: 'create', first: true },
        ],
      }),
    ).toBe(true)
  })

  it('acepta de uno a veinte fallos por llamada', () => {
    expect(PROFILE_SAVE_REPORT_MAX).toBe(20)
    expect(accepts({ failures: Array.from({ length: 20 }, () => failure) })).toBe(true)
    expect(accepts({ failures: [] })).toBe(false)
    expect(accepts({ failures: Array.from({ length: 21 }, () => failure) })).toBe(false)
  })

  it('una sesión cerrada no es un fallo de conexión y no entra', () => {
    expect(accepts({ failures: [{ ...failure, reason: 'session' }] })).toBe(false)
  })

  it('rechaza un momento desconocido y un «primero» que no es booleano', () => {
    expect(accepts({ failures: [{ ...failure, moment: 'otro' }] })).toBe(false)
    expect(accepts({ failures: [{ ...failure, first: 'true' }] })).toBe(false)
  })

  it('rechaza claves de más: por ahí se colaría un dato de la persona', () => {
    expect(accepts({ failures: [{ ...failure, name: 'Ana' }] })).toBe(false)
    expect(accepts({ failures: [failure], email: 'ana@example.test' })).toBe(false)
  })

  it('rechaza cualquier otra cosa', () => {
    expect(accepts(null)).toBe(false)
    expect(accepts('offline')).toBe(false)
    expect(accepts({ failures: ['offline'] })).toBe(false)
  })
})
