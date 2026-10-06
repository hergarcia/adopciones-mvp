// Covers: US3-AS3, US3-AS5, FR-024, FR-028; quién puede solicitar: #63 US3-AS2, research R9.
import { describe, expect, it } from 'vitest'
import { readPetDraft, shouldTrackStart, type PetDraft } from './draft'
import { EMPTY_PET_FORM } from './types'

const DAY = 24 * 60 * 60 * 1000
const now = 100 * DAY
const draft: PetDraft = {
  v: 1,
  accountId: 'ana',
  attemptId: 'intento-1',
  startedAt: now - 2 * DAY,
  updatedAt: now - DAY,
  fields: { ...EMPTY_PET_FORM, name: 'Luna', isUrgent: true },
}
const raw = (value: unknown) => JSON.stringify(value)

describe('readPetDraft', () => {
  it('vuelve para la misma cuenta, con lo escrito', () => {
    expect(readPetDraft(raw(draft), 'ana', now)).toEqual(draft)
  })

  it('ignora lo que no es del formulario', () => {
    const extra = { ...draft, fields: { ...draft.fields, avatarUrl: 'x' }, other: 1 }
    expect(readPetDraft(raw(extra), 'ana', now)).toEqual(draft)
  })

  it('guarda quién puede solicitar', () => {
    const asksIdentity = { ...draft, fields: { ...draft.fields, requiredLevel: '2' } }
    expect(readPetDraft(raw(asksIdentity), 'ana', now)?.fields.requiredLevel).toBe('2')
  })

  it('uno de antes del campo se lee con teléfono verificado', () => {
    const { requiredLevel: _dropped, ...older } = draft.fields
    const read = readPetDraft(raw({ ...draft, fields: older }), 'ana', now)
    expect(read).toEqual({ ...draft, fields: { ...draft.fields, requiredLevel: '1' } })
  })

  it('se descarta para otra cuenta', () => {
    expect(readPetDraft(raw(draft), 'juan', now)).toBeNull()
  })

  it('vence a los 30 días de la última vez que se escribió', () => {
    expect(
      readPetDraft(raw({ ...draft, updatedAt: now - 30 * DAY + 1 }), 'ana', now),
    ).not.toBeNull()
    expect(readPetDraft(raw({ ...draft, updatedAt: now - 30 * DAY }), 'ana', now)).toBeNull()
  })

  it.each([
    ['JSON roto', '{'],
    ['otra versión', raw({ ...draft, v: 2 })],
    ['sin cuenta', raw({ ...draft, accountId: 5 })],
    ['un número', '3'],
    ['null', 'null'],
    ['sin intento', raw({ ...draft, attemptId: 7 })],
    ['sin comienzo', raw({ ...draft, startedAt: '1' })],
    ['sin última vez', raw({ ...draft, updatedAt: undefined })],
    ['sin campos', raw({ ...draft, fields: null })],
    ['un campo de otro tipo', raw({ ...draft, fields: { ...draft.fields, isUrgent: 'sí' } })],
    ['un campo que falta', raw({ ...draft, fields: { ...draft.fields, locality: undefined } })],
  ])('uno roto no rompe nada: %s', (_caso, value) => {
    expect(readPetDraft(value, 'ana', now)).toBeNull()
  })
})

describe('shouldTrackStart', () => {
  it('solo con el primer dato de un formulario vacío', () => {
    expect(shouldTrackStart({ startedAt: null, restored: false })).toBe(true)
    expect(shouldTrackStart({ startedAt: now, restored: false })).toBe(false)
    expect(shouldTrackStart({ startedAt: null, restored: true })).toBe(false)
    expect(shouldTrackStart({ startedAt: now, restored: true })).toBe(false)
  })
})
