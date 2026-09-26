import { describe, expect, it } from 'vitest'
import { lostDayLabel, lostNotice } from './lost-notice'
import type { PhoneRow } from './phone-status'

function row(overrides: Partial<PhoneRow>): PhoneRow {
  return {
    verifiedNumber: null,
    verifiedAt: null,
    pendingNumber: null,
    pendingSince: null,
    numberLostOn: null,
    ...overrides,
  }
}

// Covers: #25 US2-AS2, US2-AS5, FR-011a, FR-011b. Si se equivoca, le dice a alguien que perdió su
// número cuando no, o se lo calla.
describe('el aviso de número perdido', () => {
  it('con el día guardado y sin verificado, se muestra con ese día', () => {
    expect(lostNotice(row({ numberLostOn: '2026-09-25' }))).toEqual({ lostOn: '2026-09-25' })
  })

  it('también con un número a medias', () => {
    expect(
      lostNotice(
        row({
          numberLostOn: '2026-09-25',
          pendingNumber: '+59898765432',
          pendingSince: new Date(),
        }),
      ),
    ).toEqual({ lostOn: '2026-09-25' })
  })

  it('con un teléfono verificado, no', () => {
    expect(
      lostNotice(
        row({ numberLostOn: '2026-09-25', verifiedNumber: '+59899123456', verifiedAt: new Date() }),
      ),
    ).toBeNull()
  })

  it('sin el día, o sin fila, no', () => {
    expect(lostNotice(row({}))).toBeNull()
    expect(lostNotice(null)).toBeNull()
  })
})

// Covers: #25 FR-011a. Formatearlo como un instante en Uruguay lo correría al día anterior.
describe('el día en que se perdió, en texto', () => {
  it('es ese día, no el anterior', () => {
    expect(lostDayLabel('2026-09-25', 'es')).toBe('25 de septiembre de 2026')
  })

  it('el primero del mes no se corre al último del anterior', () => {
    expect(lostDayLabel('2026-10-01', 'es')).toBe('1 de octubre de 2026')
  })
})
