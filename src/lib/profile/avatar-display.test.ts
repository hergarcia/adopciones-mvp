import { describe, expect, it } from 'vitest'
import { avatarContent } from './avatar-display'

// Covers: US2-AS6, FR-024
describe('qué se muestra en lugar de la foto', () => {
  it('con foto, la foto', () => {
    expect(avatarContent('https://x/y.webp', 'Ana García')).toEqual({
      kind: 'photo',
      url: 'https://x/y.webp',
    })
  })

  it('sin foto, las iniciales del nombre', () => {
    expect(avatarContent(null, 'Ana García')).toEqual({ kind: 'initials', text: 'AG' })
  })

  it('sin foto y sin nombre, iniciales vacías en vez de reventar', () => {
    expect(avatarContent(null, '')).toEqual({ kind: 'initials', text: '' })
  })

  it('una cadena vacía de URL no es una foto que exista', () => {
    expect(avatarContent('', 'Ana García')).toEqual({ kind: 'photo', url: '' })
  })
})
