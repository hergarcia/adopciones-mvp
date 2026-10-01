// Covers: FR-001, FR-002, FR-003, FR-014, FR-015, FR-016, US1-AS5, US2-AS1, US2-AS2, US2-AS3
// (research R1, data-model §Transiciones)
import { describe, expect, it } from 'vitest'
import { actionsFor, expiryView, lifecycleOf, needsLevelOne } from './lifecycle'
import { PET_STATUS_ACTIONS, type PetStatus } from './types'

const NOW = new Date('2026-10-01T15:00:00.000Z')
const MINUTE = 60_000
const DAY = 86_400_000
const at = (ms: number) => new Date(NOW.getTime() + ms)

describe('lifecycleOf', () => {
  const running: PetStatus[] = ['available', 'in_process']

  it.each(running)('%s con vencimiento en el futuro sigue igual', (status) => {
    expect(lifecycleOf({ status, expiresAt: at(MINUTE), takenDownAt: null }, NOW)).toBe(status)
  })

  it.each(running)('%s vence en el instante exacto', (status) => {
    expect(lifecycleOf({ status, expiresAt: at(0), takenDownAt: null }, NOW)).toBe('expired')
  })

  it.each(running)('%s con vencimiento en el pasado está vencida', (status) => {
    expect(lifecycleOf({ status, expiresAt: at(-DAY), takenDownAt: null }, NOW)).toBe('expired')
  })

  it.each(['paused', 'adopted'] as const)('%s no vence: no tiene fecha', (status) => {
    expect(lifecycleOf({ status, expiresAt: null, takenDownAt: null }, NOW)).toBe(status)
  })

  it('una pausada con una fecha vieja tampoco vence', () => {
    expect(lifecycleOf({ status: 'paused', expiresAt: at(-DAY), takenDownAt: null }, NOW)).toBe(
      'paused',
    )
  })

  it('una disponible sin fecha no vence', () => {
    expect(lifecycleOf({ status: 'available', expiresAt: null, takenDownAt: null }, NOW)).toBe(
      'available',
    )
  })

  it.each(['available', 'in_process', 'paused', 'adopted'] as const)(
    'dada de baja gana a %s, venza o no',
    (status) => {
      expect(lifecycleOf({ status, expiresAt: at(-DAY), takenDownAt: at(-MINUTE) }, NOW)).toBe(
        'taken_down',
      )
      expect(lifecycleOf({ status, expiresAt: at(DAY), takenDownAt: at(-MINUTE) }, NOW)).toBe(
        'taken_down',
      )
    },
  )
})

describe('actionsFor', () => {
  it('cada estado ofrece exactamente sus acciones, en orden', () => {
    expect(actionsFor('available')).toEqual(['renew', 'mark_in_process', 'pause', 'mark_adopted'])
    expect(actionsFor('in_process')).toEqual(['renew', 'mark_available', 'pause', 'mark_adopted'])
    expect(actionsFor('paused')).toEqual(['resume', 'mark_adopted'])
    expect(actionsFor('adopted')).toEqual(['republish'])
    expect(actionsFor('expired')).toEqual(['republish', 'mark_adopted'])
    expect(actionsFor('taken_down')).toEqual([])
  })
})

describe('needsLevelOne', () => {
  it('solo reanudar, renovar y volver a publicar', () => {
    expect(PET_STATUS_ACTIONS.filter(needsLevelOne)).toEqual(['resume', 'renew', 'republish'])
  })
})

describe('expiryView', () => {
  it('disponible lejos de vencer: el día de Uruguay, sin marca', () => {
    // 20 días después, a las 02:00 UTC: en Uruguay todavía es el día anterior.
    const expiresAt = new Date('2026-10-21T02:00:00.000Z')
    expect(expiryView('available', expiresAt, NOW)).toEqual({
      kind: 'expires',
      day: '2026-10-20',
      soon: false,
    })
  })

  it('con 7 días justos ya es próxima', () => {
    expect(expiryView('in_process', at(7 * DAY), NOW)).toEqual({
      kind: 'expires',
      day: '2026-10-08',
      soon: true,
    })
  })

  it('con 7 días y un minuto todavía no', () => {
    expect(expiryView('available', at(7 * DAY + MINUTE), NOW)).toMatchObject({ soon: false })
  })

  it('vencida: el día en que venció', () => {
    expect(expiryView('expired', at(-2 * DAY), NOW)).toEqual({ kind: 'expired', day: '2026-09-29' })
  })

  it.each(['paused', 'adopted', 'taken_down'] as const)('%s no muestra nada', (state) => {
    expect(expiryView(state, at(DAY), NOW)).toBeNull()
  })

  it('sin fecha no muestra nada', () => {
    expect(expiryView('available', null, NOW)).toBeNull()
  })
})
