import { describe, expect, it } from 'vitest'
import { parseSaveMoment, profileSaveOutcome } from './save-outcome'

// Covers: US2-AS1, US2-AS2, US4-AS4, US4-AS5 (FR-012, FR-013, SC-005)
describe('qué se cuenta y qué se confirma después de guardar el perfil', () => {
  it('el primer guardado es el alta, se cuenta una vez y confirma «Perfil guardado»', () => {
    for (const mode of ['create', 'edit'] as const) {
      expect(profileSaveOutcome({ existedBefore: false, mode, recovered: false })).toEqual({
        events: [{ name: 'account_creation_finished' }],
        wasComplete: false,
      })
    }
  })

  it('el reintento de un alta que ya había llegado no cuenta nada y confirma como alta', () => {
    expect(profileSaveOutcome({ existedBefore: true, mode: 'create', recovered: false })).toEqual({
      events: [],
      wasComplete: false,
    })
  })

  it('una edición se cuenta como edición y confirma «Cambios guardados»', () => {
    expect(profileSaveOutcome({ existedBefore: true, mode: 'edit', recovered: false })).toEqual({
      events: [{ name: 'profile_edited' }],
      wasComplete: true,
    })
  })

  it('un guardado recuperado suma «recuperado» con el momento, sin cambiar lo demás', () => {
    expect(profileSaveOutcome({ existedBefore: false, mode: 'create', recovered: true })).toEqual({
      events: [
        { name: 'account_creation_finished' },
        { name: 'profile_save_recovered', props: { moment: 'create' } },
      ],
      wasComplete: false,
    })
    expect(profileSaveOutcome({ existedBefore: true, mode: 'create', recovered: true })).toEqual({
      events: [{ name: 'profile_save_recovered', props: { moment: 'create' } }],
      wasComplete: false,
    })
    expect(profileSaveOutcome({ existedBefore: true, mode: 'edit', recovered: true })).toEqual({
      events: [
        { name: 'profile_edited' },
        { name: 'profile_save_recovered', props: { moment: 'edit' } },
      ],
      wasComplete: true,
    })
  })
})

describe('el modo que manda el formulario', () => {
  it('se toma tal cual si es uno conocido', () => {
    expect(parseSaveMoment('create')).toBe('create')
    expect(parseSaveMoment('edit')).toBe('edit')
  })

  it('cualquier otra cosa es una edición', () => {
    expect(parseSaveMoment('crear')).toBe('edit')
    expect(parseSaveMoment('')).toBe('edit')
    expect(parseSaveMoment(null)).toBe('edit')
  })
})
