// Covers: FR-032, US4-AS6. Un rechazo por una regla que llega al registro lo llena de cosas que el
// sitio hace bien; una falla que no llega es una que nadie arregla.
import { describe, expect, it } from 'vitest'
import { isFaultKey } from './is-fault'

describe('isFaultKey', () => {
  it.each([
    'profile.errors.save_failed',
    'verification.errors.send_failed',
    'applications.errors.failed',
    'verification.claim.errors.unknown',
  ])('%s es una falla', (key) => {
    expect(isFaultKey(key)).toBe(true)
  })

  it.each([
    'pets.errors.invalid',
    'moderation.errors.not_admin',
    'identity.errors.session',
    'verification.errors.code_format',
    'auth.errors.link_unknown',
    'auth.errors.failed_reason',
  ])('%s es un rechazo', (key) => {
    expect(isFaultKey(key)).toBe(false)
  })
})
