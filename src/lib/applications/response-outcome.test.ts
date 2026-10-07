// Covers: FR-011, FR-044, FR-064, US1-AS11, US1-AS12 (lo que ve el publicador al aceptar)
import { describe, expect, it } from 'vitest'
import { acceptOutcome } from './response-outcome'

const ID = '7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a'

describe('acceptOutcome', () => {
  it('aceptada, con si fue la primera respuesta', () => {
    expect(acceptOutcome({ outcome: 'accepted', firstResponse: true }, ID)).toEqual({
      ok: true,
      data: { firstResponse: true },
    })
  })

  it('un doble toque cuenta como aceptada', () => {
    expect(acceptOutcome({ outcome: 'already_accepted', firstResponse: false }, ID)).toEqual({
      ok: true,
      data: { firstResponse: false },
    })
  })

  it('sin su teléfono, al aviso de verificación con la vuelta y el origen en la solicitud', () => {
    expect(acceptOutcome({ outcome: 'publisher_needs_phone', firstResponse: false }, ID)).toEqual({
      ok: false,
      error: 'inbox.errors.publisher_needs_phone',
      detail: {
        redirect: `/verificar-telefono?para=aceptar&next=%2Fsolicitudes%2F${ID}&desde=%2Fsolicitudes%2F${ID}`,
      },
    })
  })

  it.each([
    'rejected',
    'gone',
    'you_blocked',
    'closed',
    'applicant_needs_phone',
    'not_found',
  ] as const)('%s: no cambia nada y lo dice', (outcome) => {
    expect(acceptOutcome({ outcome, firstResponse: false }, ID)).toEqual({
      ok: false,
      error: `inbox.errors.${outcome}`,
    })
  })

  it('sin respuesta de la base, el error genérico', () => {
    expect(acceptOutcome(null, ID)).toEqual({ ok: false, error: 'inbox.errors.failed' })
  })
})
