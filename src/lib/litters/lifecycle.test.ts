// Covers: FR-002, FR-003, FR-004, FR-030, US2-AS1, US2-AS2, US2-AS9 (spec Edge Cases, research R1, R2)
import { describe, expect, it } from 'vitest'
import {
  actionsForLitter,
  actionsForYoung,
  leadActionForLitter,
  litterStateOf,
  needsLevelOne,
  youngStateOf,
} from './lifecycle'
import { LITTER_STATES, LITTER_STATUS_ACTIONS } from './types'

const NOW = new Date('2026-10-26T15:00:00.000Z')
const DAY = 86_400_000
const at = (ms: number) => new Date(NOW.getTime() + ms)
const open = { takenDownAt: null, pausedAt: null, expiresAt: at(DAY) }

describe('youngStateOf', () => {
  it.each(['available', 'in_process', 'adopted'] as const)('%s es su propio estado', (status) => {
    expect(youngStateOf({ status, resumeStatus: null })).toBe(status)
  })

  it('pausada con su camada vuelve a lo que guardó', () => {
    expect(youngStateOf({ status: 'paused', resumeStatus: 'in_process' })).toBe('in_process')
    expect(youngStateOf({ status: 'paused', resumeStatus: 'available' })).toBe('available')
  })

  it('pausada sin nada guardado vuelve disponible', () => {
    expect(youngStateOf({ status: 'paused', resumeStatus: null })).toBe('available')
  })
})

describe('litterStateOf', () => {
  it('con alguna cría sin adoptar y nada más, disponible', () => {
    expect(litterStateOf(open, ['adopted', 'available'], NOW)).toBe('available')
    expect(litterStateOf(open, ['in_process'], NOW)).toBe('available')
  })

  it('todas adoptadas: adoptada, aunque esté pausada o vencida', () => {
    expect(litterStateOf(open, ['adopted', 'adopted'], NOW)).toBe('adopted')
    expect(
      litterStateOf({ ...open, pausedAt: at(-DAY), expiresAt: at(-DAY) }, ['adopted'], NOW),
    ).toBe('adopted')
  })

  it('dada de baja gana a todo', () => {
    expect(litterStateOf({ ...open, takenDownAt: at(-DAY) }, ['adopted'], NOW)).toBe('taken_down')
  })

  it('pausada antes que vencida', () => {
    const paused = { ...open, pausedAt: at(-DAY), expiresAt: at(-DAY) }
    expect(litterStateOf(paused, ['available'], NOW)).toBe('paused')
  })

  it('vence en el instante exacto', () => {
    expect(litterStateOf({ ...open, expiresAt: at(0) }, ['available'], NOW)).toBe('expired')
    expect(litterStateOf({ ...open, expiresAt: at(1) }, ['available'], NOW)).toBe('available')
  })
})

describe('actionsForYoung', () => {
  it('con la camada disponible, cada estado tiene las suyas', () => {
    expect(actionsForYoung('available', 'available')).toEqual(['mark_in_process', 'mark_adopted'])
    expect(actionsForYoung('in_process', 'available')).toEqual(['mark_available', 'mark_adopted'])
    expect(actionsForYoung('adopted', 'available')).toEqual(['mark_available'])
  })

  it.each(['paused', 'expired'] as const)('con la camada %s, solo se entrega', (litter) => {
    expect(actionsForYoung('available', litter)).toEqual(['mark_adopted'])
    expect(actionsForYoung('in_process', litter)).toEqual(['mark_adopted'])
    expect(actionsForYoung('adopted', litter)).toEqual([])
  })

  it.each(['adopted', 'taken_down'] as const)('con la camada %s, ninguna', (litter) => {
    expect(actionsForYoung('adopted', litter)).toEqual([])
    expect(actionsForYoung('available', litter)).toEqual([])
  })
})

describe('actionsForLitter', () => {
  it('cada estado ofrece exactamente sus acciones, en orden', () => {
    expect(actionsForLitter('available')).toEqual(['renew', 'pause'])
    expect(actionsForLitter('paused')).toEqual(['resume'])
    expect(actionsForLitter('expired')).toEqual(['republish'])
    expect(actionsForLitter('adopted')).toEqual(['republish'])
    expect(actionsForLitter('taken_down')).toEqual([])
  })
})

describe('leadActionForLitter', () => {
  it('pausada y vencida tienen su vuelta a la vista, venza o no pronto', () => {
    for (const soon of [false, true]) {
      expect(leadActionForLitter('paused', soon)).toBe('resume')
      expect(leadActionForLitter('expired', soon)).toBe('republish')
    }
  })

  it('disponible, «Renovar» solo cuando vence pronto', () => {
    expect(leadActionForLitter('available', true)).toBe('renew')
    expect(leadActionForLitter('available', false)).toBeNull()
  })

  it.each(LITTER_STATES.filter((state) => !['paused', 'expired', 'available'].includes(state)))(
    '%s no tiene',
    (state) => {
      expect(leadActionForLitter(state, true)).toBeNull()
    },
  )
})

describe('needsLevelOne', () => {
  it('todo lo que vuelve a poner a la vista, y pausar no', () => {
    expect(LITTER_STATUS_ACTIONS.filter(needsLevelOne)).toEqual(['resume', 'renew', 'republish'])
  })
})
