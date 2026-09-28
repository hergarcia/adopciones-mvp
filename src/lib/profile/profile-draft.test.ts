import { describe, expect, it } from 'vitest'
import { isForeignDraft, readDraft, serializeDraft } from './profile-draft'

const OWNER = 'a1b2c3'
const initial = {
  displayName: 'Nombre de Google',
  department: '',
  locality: '',
  isRescuer: false,
  avatarUrl: 'https://example.test/foto.png',
}
const written = { displayName: 'Ana', department: 'UY-MO', locality: 'Malvín', isRescuer: true }

function draft(owner: unknown, values: unknown) {
  return JSON.stringify({ owner, values })
}

// Covers: US3-AS1, US3-AS2, US3-AS3 (FR-014, FR-015, FR-016, FR-017)
describe('escribir el borrador del alta', () => {
  it('guarda el dueño y los cuatro campos, y nunca la foto', () => {
    const raw = serializeDraft(OWNER, { ...written, avatarUrl: 'blob:foto' } as typeof written)
    expect(JSON.parse(raw)).toEqual({ owner: OWNER, values: written })
    expect(raw).not.toContain('foto')
  })
})

describe('leer el borrador del alta', () => {
  it('sin borrador, la pantalla arranca con lo que trae y no hay nada que borrar', () => {
    expect(readDraft(null, OWNER, initial)).toEqual({ values: initial, discard: false })
  })

  it('el borrador de la misma cuenta vuelve entero, sobre lo que trae la pantalla', () => {
    expect(readDraft(serializeDraft(OWNER, written), OWNER, initial)).toEqual({
      values: { ...written, avatarUrl: initial.avatarUrl },
      discard: false,
    })
  })

  it('un campo vacío del borrador no pisa lo que trae la pantalla', () => {
    const raw = serializeDraft(OWNER, { ...written, displayName: '' })
    expect(readDraft(raw, OWNER, initial).values.displayName).toBe('Nombre de Google')
  })

  it('la marca desmarcada en el borrador sí vale', () => {
    const raw = serializeDraft(OWNER, { ...written, isRescuer: false })
    expect(readDraft(raw, OWNER, { ...initial, isRescuer: true }).values.isRescuer).toBe(false)
  })

  it('un campo con un tipo que no corresponde se ignora', () => {
    const raw = draft(OWNER, {
      displayName: 7,
      department: 'UY-SA',
      locality: null,
      isRescuer: 'sí',
    })
    expect(readDraft(raw, OWNER, initial)).toEqual({
      values: { ...initial, department: 'UY-SA' },
      discard: false,
    })
  })

  it('un borrador de la misma cuenta sin valores no cambia nada', () => {
    expect(readDraft(draft(OWNER, null), OWNER, initial)).toEqual({
      values: initial,
      discard: false,
    })
  })

  it('el de otra cuenta no se muestra y se descarta', () => {
    expect(readDraft(serializeDraft('otra', written), OWNER, initial)).toEqual({
      values: initial,
      discard: true,
    })
  })

  it('el de la forma vieja, sin dueño, no se muestra y se descarta', () => {
    expect(readDraft(JSON.stringify(written), OWNER, initial)).toEqual({
      values: initial,
      discard: true,
    })
  })

  it('uno roto no rompe el alta: arranca con lo que trae y se descarta', () => {
    expect(readDraft('{no es json', OWNER, initial)).toEqual({ values: initial, discard: true })
    expect(readDraft('null', OWNER, initial)).toEqual({ values: initial, discard: true })
  })
})

describe('de quién es el borrador', () => {
  it('sin borrador no hay nada ajeno', () => {
    expect(isForeignDraft(null, OWNER)).toBe(false)
  })

  it('es ajeno si no es de esta cuenta', () => {
    expect(isForeignDraft(serializeDraft(OWNER, written), OWNER)).toBe(false)
    expect(isForeignDraft(serializeDraft('otra', written), OWNER)).toBe(true)
    expect(isForeignDraft(JSON.stringify(written), OWNER)).toBe(true)
    expect(isForeignDraft('"texto"', OWNER)).toBe(true)
  })
})
