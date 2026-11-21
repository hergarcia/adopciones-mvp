import { describe, expect, it } from 'vitest'
import { PROFILE_LINK_ORIGINS } from './events'
import { profileLinkProps } from './profile-events'

// Covers: US2-AS1, US2-AS4, US2-AS5, US2-AS7, FR-015, FR-017, FR-018. Si un nivel que no se pudo leer llega
// como «nada», la beta cuenta como sin verificar a quien sí verificó y se presenta con su perfil.
describe('el enlace del perfil copiado o mandado', () => {
  it('lleva el nivel de la dueña', () => {
    expect(profileLinkProps('my_profile', 2)).toStrictEqual({ from: 'my_profile', owner_level: 2 })
  })

  it('sin nada verificado, con el nivel «nada», no afuera', () => {
    expect(profileLinkProps('my_profile', 0)).toStrictEqual({ from: 'my_profile', owner_level: 0 })
  })

  it('sin el nivel, sin la propiedad', () => {
    expect(profileLinkProps('my_profile', null)).toStrictEqual({ from: 'my_profile' })
  })

  it.each(PROFILE_LINK_ORIGINS)('desde %s, con la pantalla de siempre', (from) => {
    expect(profileLinkProps(from, 3)).toStrictEqual({ from, owner_level: 3 })
    expect(profileLinkProps(from, null)).toStrictEqual({ from })
  })
})
