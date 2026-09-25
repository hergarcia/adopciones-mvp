import { describe, expect, it } from 'vitest'
import { claimDeadline } from './claim-deadline'

const URUGUAY = { timeZone: 'America/Montevideo', locale: 'es' }
const UNTIL = new Date('2026-09-25T14:32:00-03:00')

// Covers: #25 FR-005a. La hora que se le promete a la persona y el momento en que la pantalla cambia.
describe('la hora límite para quedarse con el número', () => {
  it('se dice en hora de Uruguay', () => {
    expect(claimDeadline(UNTIL, new Date('2026-09-25T14:25:00-03:00'), URUGUAY)).toEqual({
      label: '14:32',
      msLeft: 7 * 60 * 1000,
    })
  })

  it('un segundo antes queda un segundo', () => {
    expect(claimDeadline(UNTIL, new Date(UNTIL.getTime() - 1000), URUGUAY).msLeft).toBe(1000)
  })

  it('en la hora justa, cero', () => {
    expect(claimDeadline(UNTIL, UNTIL, URUGUAY).msLeft).toBe(0)
  })

  it('después, cero y nunca negativo', () => {
    expect(claimDeadline(UNTIL, new Date(UNTIL.getTime() + 60_000), URUGUAY).msLeft).toBe(0)
  })

  it('a las 23:58 de Uruguay se dice 23:58, aunque en UTC ya sea otro día', () => {
    const late = new Date('2026-09-25T23:58:00-03:00')
    expect(claimDeadline(late, new Date('2026-09-25T23:50:00-03:00'), URUGUAY).label).toBe('23:58')
  })
})
