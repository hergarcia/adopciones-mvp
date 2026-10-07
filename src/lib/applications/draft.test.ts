// Covers: FR-040, FR-041, FR-042, US1-AS12 (el borrador de la solicitud, por animal y por cuenta)
import { describe, expect, it } from 'vitest'
import { applicationDraftKey, readApplicationDraft } from './draft'

const NOW = Date.UTC(2026, 9, 6, 12)
const DAY = 24 * 60 * 60 * 1000

const DRAFT = {
  v: 1,
  accountId: 'cuenta-1',
  attemptId: 'intento-1',
  startedAt: NOW - 3 * DAY,
  updatedAt: NOW - DAY,
  answers: { housing_type: 'house', why_this_pet: 'Porque sí' },
}

const read = (value: unknown, accountId = 'cuenta-1', now = NOW) =>
  readApplicationDraft(JSON.stringify(value), accountId, now)

describe('readApplicationDraft', () => {
  it('el de la misma cuenta, vigente, vuelve entero', () => {
    expect(read(DRAFT)).toStrictEqual(DRAFT)
  })

  it('el de otra cuenta no se lee', () => {
    expect(read(DRAFT, 'cuenta-2')).toBeNull()
  })

  it('vence a los 30 días desde la última escritura', () => {
    expect(read({ ...DRAFT, updatedAt: NOW - 30 * DAY + 1 })).not.toBeNull()
    expect(read({ ...DRAFT, updatedAt: NOW - 30 * DAY })).toBeNull()
  })

  it('uno roto, de otra versión o con otra forma se descarta', () => {
    expect(readApplicationDraft('{roto', 'cuenta-1', NOW)).toBeNull()
    expect(read({ ...DRAFT, v: 2 })).toBeNull()
    expect(read({ ...DRAFT, answers: { housing_type: 3 } })).toBeNull()
    expect(read({ ...DRAFT, attemptId: undefined })).toBeNull()
    expect(read({ ...DRAFT, startedAt: 'ayer' })).toBeNull()
  })

  it('lo que no es una pregunta se descarta', () => {
    expect(read({ ...DRAFT, answers: { ...DRAFT.answers, phone: '099123456' } })).toStrictEqual(
      DRAFT,
    )
  })
})

describe('applicationDraftKey', () => {
  it('una clave por animal, con el prefijo que borra el cierre de sesión', () => {
    expect(applicationDraftKey('semana0001')).toBe('application-draft:semana0001')
    expect(applicationDraftKey('semana0002')).not.toBe(applicationDraftKey('semana0001'))
  })
})
