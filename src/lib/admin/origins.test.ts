// Covers: FR-080 (Administrar abierto desde el menú, Mi perfil o el resumen; una ficha, desde cada
// lista o la búsqueda)
import { describe, expect, it } from 'vitest'
import { RECORD_FROM } from './paths'
import { parseAdminOrigin, parseRecordOrigin } from './origins'

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

describe('parseRecordOrigin', () => {
  it('cada valor de `?desde=` de una ficha a su origen', () => {
    expect(parseRecordOrigin('identidad')).toBe('identity')
    expect(parseRecordOrigin('publicaciones')).toBe('pets')
    expect(parseRecordOrigin('reportes')).toBe('reports')
    expect(parseRecordOrigin('suspendidas')).toBe('suspended')
    expect(parseRecordOrigin('busqueda')).toBe('search')
  })

  it('lee lo mismo que escriben los enlaces a la ficha', () => {
    for (const [origin, value] of Object.entries(RECORD_FROM)) {
      expect(parseRecordOrigin(value)).toBe(origin)
    }
  })

  it('otro valor, ninguno o repetido es `other`', () => {
    expect(parseRecordOrigin('menu')).toBe('other')
    expect(parseRecordOrigin(undefined)).toBe('other')
    expect(parseRecordOrigin(['reportes', 'busqueda'])).toBe('other')
  })
})
