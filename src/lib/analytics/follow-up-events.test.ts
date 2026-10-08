// Covers: FR-060, FR-061 (el pedido y el no pedido, sin ids ni datos de nadie)
import { describe, expect, it } from 'vitest'
import { followUpResolvedEvent } from './follow-up-events'

describe('followUpResolvedEvent', () => {
  it('pedido: el evento solo, sin propiedades', () => {
    expect(followUpResolvedEvent({ status: 'requested' })).toEqual({ name: 'follow_up_requested' })
  })

  it.each(['account_deleted', 'ended', 'declined', 'blocked', 'suspended'] as const)(
    'no pedido por %s: solo el motivo',
    (reason) => {
      expect(followUpResolvedEvent({ status: 'skipped', reason })).toEqual({
        name: 'follow_up_skipped',
        props: { reason },
      })
    },
  )
})
