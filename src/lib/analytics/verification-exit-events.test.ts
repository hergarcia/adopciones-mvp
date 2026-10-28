// Covers: FR-028, R9 (el nivel, el origen, la opción y si escribió; nunca el texto ni un id)
import { describe, expect, it } from 'vitest'
import {
  verificationExitAnsweredEvent,
  verificationExitAskedEvent,
  verificationExitSkippedEvent,
} from './verification-exit-events'

describe('los eventos de «¿Qué te frena?»', () => {
  it('preguntada: el nivel y el origen', () => {
    expect(verificationExitAskedEvent('identity', 'apply')).toEqual({
      name: 'verification_exit_asked',
      props: { level: 'identity', origin: 'apply' },
    })
  })

  it('contestada: el nivel, la opción, el origen y si escribió, sin el texto ni el ticket', () => {
    const answer = {
      level: 'identity',
      option: 'other',
      origin: 'self',
      wrote: true,
      body: 'no tengo la cédula, tengo pasaporte',
      ticket: '6d1f5f0e-8a59-4f53-9a77-3c1c3e1a0b11',
    } as const
    expect(verificationExitAnsweredEvent(answer)).toEqual({
      name: 'verification_exit_answered',
      props: { level: 'identity', option: 'other', origin: 'self', wrote: true },
    })
  })

  it('seguida sin contestar: el nivel y el origen', () => {
    expect(verificationExitSkippedEvent('phone', 'publish')).toEqual({
      name: 'verification_exit_skipped',
      props: { level: 'phone', origin: 'publish' },
    })
  })
})
