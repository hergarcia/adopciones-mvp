import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { RejectionReason } from './identity'
import {
  addDays,
  canRequest,
  identityStatus,
  uruguayDay,
  type IdentityRecord,
  type IdentityStatus,
} from './identity-status'

// El día tiene que salir de la zona de Uruguay y no de la de la máquina: con la máquina en Tokio, un
// cálculo que use la zona local se corre de día.
const machineZone = process.env.TZ
beforeAll(() => {
  process.env.TZ = 'Asia/Tokyo'
})
afterAll(() => {
  process.env.TZ = machineZone
})

// Mediodía del 26 de septiembre en Uruguay: "hoy" es 2026-09-26 y la ventana de 30 días empieza
// después del 2026-08-27.
const NOW = new Date('2026-09-26T15:00:00Z')
const EMPTY: IdentityRecord = { request: null, verifiedOn: null, rejections: [], expiredOn: null }

const rejected = (rejectedOn: string, reason: RejectionReason = 'unreadable') => ({
  rejectedOn,
  reason,
})
const status = (record: Partial<IdentityRecord>) => identityStatus({ ...EMPTY, ...record }, NOW)

// Covers: FR-027, FR-028. El día de Uruguay, no el de UTC: a la 1 de la mañana UTC todavía es el
// día anterior en Montevideo.
describe('los días', () => {
  it('el día de un instante es el de Uruguay', () => {
    expect(uruguayDay(new Date('2026-09-27T01:00:00Z'))).toBe('2026-09-26')
    expect(uruguayDay(new Date('2026-09-27T03:00:00Z'))).toBe('2026-09-27')
  })

  it('sumar y restar días cruza meses', () => {
    expect(addDays('2026-09-26', 30)).toBe('2026-10-26')
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
  })
})

// Covers: US1-AS4, US2-AS4, US2-AS5, US3-AS1, US3-AS2, US3-AS4, FR-011, FR-027, FR-027a, FR-028,
// FR-031
describe('el estado del pedido para la persona', () => {
  it('sin nada guardado, nunca pidió', () => {
    expect(status({})).toEqual({ kind: 'none' })
  })

  it('en revisión, con el día en que se mandó y el instante en que vence', () => {
    const sentAt = new Date('2026-09-25T12:00:00Z')
    const expiresAt = new Date('2026-10-02T12:00:00Z')
    expect(status({ request: { sentAt, expiresAt } })).toEqual({
      kind: 'in_review',
      sentAt,
      expiresAt,
    })
  })

  it('vence en el instante exacto, aunque la tarea no lo haya borrado', () => {
    const sentAt = new Date('2026-09-19T15:00:00Z')
    expect(status({ request: { sentAt, expiresAt: NOW } })).toEqual({
      kind: 'expired',
      on: '2026-09-26',
    })
    expect(status({ request: { sentAt, expiresAt: new Date(NOW.getTime() + 1) } }).kind).toBe(
      'in_review',
    )
  })

  it('el día de un vencimiento sin borrar es el de Uruguay', () => {
    const expiresAt = new Date('2026-09-26T01:00:00Z')
    expect(status({ request: { sentAt: expiresAt, expiresAt } })).toEqual({
      kind: 'expired',
      on: '2026-09-25',
    })
  })

  it('aprobado, con su día, gana sobre todo lo demás', () => {
    expect(
      status({
        verifiedOn: '2026-09-20',
        request: { sentAt: NOW, expiresAt: new Date('2026-10-03T15:00:00Z') },
        rejections: [rejected('2026-09-10'), rejected('2026-09-11'), rejected('2026-09-12')],
        expiredOn: '2026-09-15',
      }),
    ).toEqual({ kind: 'approved', on: '2026-09-20' })
  })

  it('rechazado, con el motivo del último y los intentos que quedan', () => {
    expect(status({ rejections: [rejected('2026-09-20', 'mismatch')] })).toEqual({
      kind: 'rejected',
      on: '2026-09-20',
      reason: 'mismatch',
      attemptsLeft: 2,
    })
    expect(
      status({
        rejections: [rejected('2026-09-10', 'unreadable'), rejected('2026-09-21', 'mismatch')],
      }),
    ).toEqual({ kind: 'rejected', on: '2026-09-21', reason: 'mismatch', attemptsLeft: 1 })
  })

  it('el último es el más nuevo, lleguen en el orden que lleguen', () => {
    expect(
      status({
        rejections: [rejected('2026-09-21', 'mismatch'), rejected('2026-09-10', 'unreadable')],
      }),
    ).toMatchObject({ on: '2026-09-21', reason: 'mismatch' })
  })

  it('el tercero en la ventana deja sin intentos hasta que el más viejo cumple 30 días', () => {
    expect(
      status({
        rejections: [
          rejected('2026-09-05', 'unreadable'),
          rejected('2026-09-24', 'suspected_fraud'),
          rejected('2026-09-15', 'mismatch'),
        ],
      }),
    ).toEqual({
      kind: 'capped',
      on: '2026-09-24',
      reason: 'suspected_fraud',
      retryOn: '2026-10-05',
    })
  })

  it('con más de tres, cuenta el más viejo de los tres que la dejan en el tope', () => {
    expect(
      status({
        rejections: [
          rejected('2026-09-01'),
          rejected('2026-09-05'),
          rejected('2026-09-15'),
          rejected('2026-09-24'),
        ],
      }),
    ).toMatchObject({ kind: 'capped', retryOn: '2026-10-05' })
  })

  it('un rechazo de hace exactamente 30 días ya no cuenta; uno de hace 29, sí', () => {
    expect(
      status({
        rejections: [rejected('2026-08-27'), rejected('2026-09-10'), rejected('2026-09-11')],
      }),
    ).toMatchObject({ kind: 'rejected', attemptsLeft: 1 })
    expect(
      status({
        rejections: [rejected('2026-08-28'), rejected('2026-09-10'), rejected('2026-09-11')],
      }),
    ).toMatchObject({ kind: 'capped', retryOn: '2026-09-27' })
    expect(status({ rejections: [rejected('2026-08-27')] })).toEqual({ kind: 'none' })
  })

  it('vencido, con su día, y gana sobre los rechazos que tuvo antes', () => {
    expect(status({ expiredOn: '2026-09-20' })).toEqual({ kind: 'expired', on: '2026-09-20' })
    expect(status({ expiredOn: '2026-09-20', rejections: [rejected('2026-09-10')] })).toEqual({
      kind: 'expired',
      on: '2026-09-20',
    })
  })

  it('el tope gana sobre un vencimiento', () => {
    expect(
      status({
        expiredOn: '2026-09-25',
        rejections: [rejected('2026-09-10'), rejected('2026-09-11'), rejected('2026-09-12')],
      }).kind,
    ).toBe('capped')
  })

  it('un vencimiento de hace 30 días ya no se muestra; uno de hace 29, sí', () => {
    expect(status({ expiredOn: '2026-08-27' })).toEqual({ kind: 'none' })
    expect(status({ expiredOn: '2026-08-28' })).toEqual({ kind: 'expired', on: '2026-08-28' })
  })
})

// Covers: FR-009, FR-027
describe('puede empezar un pedido', () => {
  const cases: [IdentityStatus, boolean][] = [
    [{ kind: 'none' }, true],
    [{ kind: 'rejected', on: '2026-09-20', reason: 'mismatch', attemptsLeft: 1 }, true],
    [{ kind: 'expired', on: '2026-09-20' }, true],
    [{ kind: 'in_review', sentAt: NOW, expiresAt: NOW }, false],
    [{ kind: 'approved', on: '2026-09-20' }, false],
    [{ kind: 'capped', on: '2026-09-20', reason: 'mismatch', retryOn: '2026-10-01' }, false],
  ]

  it.each(cases)('%o → %s', (given, expected) => {
    expect(canRequest(given)).toBe(expected)
  })
})
