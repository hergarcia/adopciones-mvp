import { describe, expect, it } from 'vitest'
import { APP_URL } from '@/lib/config'
import {
  isPublicId,
  levelsPath,
  publicPhotoPath,
  publicProfilePath,
  publicProfileUrl,
} from './public-paths'

// Covers: FR-007, FR-008. Un id que pasa sin ser uno llega a la base; uno que no pasa siendo uno
// deja a una persona con un enlace que dice «no existe».
describe('el id del enlace al perfil', () => {
  it('acepta 22 caracteres de base64url, con guion y guion bajo', () => {
    expect(isPublicId('SemillaCarla0000000005')).toBe(true)
    expect(isPublicId('a-b_c-d_e-f_g-h_i-j_kl')).toBe(true)
  })

  it.each([
    ['21 caracteres', 'SemillaCarla000000005'],
    ['23 caracteres', 'SemillaCarla00000000005'],
    ['un símbolo', 'SemillaCarla000000000+'],
    ['una barra', 'SemillaCarla000000000/'],
    ['un espacio', 'SemillaCarla 000000005'],
    ['vacío', ''],
    ['un id bueno con algo antes', 'xSemillaCarla0000000005'],
    ['un id bueno con algo después', 'SemillaCarla0000000005x'],
  ])('rechaza %s', (_caso, candidate) => {
    expect(isPublicId(candidate)).toBe(false)
  })
})

describe('las rutas del perfil público', () => {
  it('el perfil, su enlace absoluto y su foto', () => {
    expect(publicProfilePath('SemillaCarla0000000005')).toBe('/perfil/SemillaCarla0000000005')
    expect(publicProfileUrl('SemillaCarla0000000005')).toBe(
      `${APP_URL.replace(/\/$/, '')}/perfil/SemillaCarla0000000005`,
    )
    expect(publicPhotoPath('SemillaCarla0000000005')).toBe('/perfil/SemillaCarla0000000005/foto')
  })
})

// Covers: FR-024. La vuelta de la explicación no puede ser un redirect abierto.
describe('la explicación de los niveles', () => {
  it('destaca el nivel y guarda la vuelta', () => {
    expect(levelsPath(2, '/perfil/SemillaCarla0000000005')).toBe(
      '/niveles?nivel=2&desde=%2Fperfil%2FSemillaCarla0000000005',
    )
  })

  it('sin nivel no destaca ninguno', () => {
    expect(levelsPath(0, '/mi-perfil')).toBe('/niveles?desde=%2Fmi-perfil')
  })

  it('sin vuelta, la ruta a secas', () => {
    expect(levelsPath(0, null)).toBe('/niveles')
    expect(levelsPath(3, null)).toBe('/niveles?nivel=3')
  })

  it('una vuelta a otro sitio se cambia por una de este', () => {
    expect(levelsPath(1, '//otro.com')).toBe('/niveles?nivel=1&desde=%2Fmi-perfil')
  })
})
