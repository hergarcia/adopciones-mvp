// Covers: US3-AS1, US3-AS6, FR-018, FR-021, FR-022, FR-023, FR-020a.
import { describe, expect, it } from 'vitest'
import { classifySaveOutcome } from './save-failure'

const base = { rejected: false, online: true, timedOut: false }

describe('classifySaveOutcome', () => {
  it('rechazada sin conexión es offline; con conexión, el sitio', () => {
    expect(classifySaveOutcome({ ...base, rejected: true, online: false })).toBe('offline')
    expect(classifySaveOutcome({ ...base, rejected: true, online: true })).toBe('site')
  })

  it('sin respuesta es lo mismo que rechazada', () => {
    expect(classifySaveOutcome({ ...base, online: false })).toBe('offline')
    expect(classifySaveOutcome(base)).toBe('site')
  })

  it('pasado el tope es el sitio, aunque haya respuesta o no haya conexión', () => {
    expect(classifySaveOutcome({ ...base, timedOut: true, result: { ok: true } })).toBe('site')
    expect(classifySaveOutcome({ ...base, timedOut: true, online: false, rejected: true })).toBe(
      'site',
    )
  })

  it('una respuesta buena es ok, aunque el navegador diga que no hay conexión', () => {
    expect(classifySaveOutcome({ ...base, result: { ok: true } })).toBe('ok')
    expect(classifySaveOutcome({ ...base, online: false, result: { ok: true } })).toBe('ok')
  })

  it.each([
    ['pets.errors.session', 'session'],
    ['pets.errors.needs_verification', 'level'],
    ['pets.errors.changed_elsewhere', 'changed_elsewhere'],
    ['pets.errors.not_found', 'not_found'],
    ['pets.errors.taken_down', 'taken_down'],
    ['pets.errors.photos_invalid', 'photos_invalid'],
    ['pets.errors.invalid', 'invalid'],
    ['pets.errors.duplicate_name', 'duplicate_name'],
    ['pets.errors.save_failed', 'site'],
    ['pets.errors.photo_upload_failed', 'site'],
  ])('%s → %s', (error, expected) => {
    expect(classifySaveOutcome({ ...base, result: { ok: false, error } })).toBe(expected)
  })

  it('un error sin clave es el sitio', () => {
    expect(classifySaveOutcome({ ...base, result: { ok: false } })).toBe('site')
  })
})
