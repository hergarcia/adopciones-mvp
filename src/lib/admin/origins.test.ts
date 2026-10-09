// Covers: FR-080 (Administrar abierto desde el menú, Mi perfil o el resumen)
import { describe, expect, it } from 'vitest'
import { parseAdminOrigin } from './origins'

describe('parseAdminOrigin', () => {
  it('cada valor de `?desde=` a su origen', () => {
    expect(parseAdminOrigin('menu')).toBe('menu')
    expect(parseAdminOrigin('perfil')).toBe('profile')
    expect(parseAdminOrigin('resumen')).toBe('digest')
  })

  it('otro valor, ninguno o repetido es `other`', () => {
    expect(parseAdminOrigin('portada')).toBe('other')
    expect(parseAdminOrigin(undefined)).toBe('other')
    expect(parseAdminOrigin(['menu', 'perfil'])).toBe('other')
  })
})
