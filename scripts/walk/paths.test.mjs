import { describe, expect, it } from 'vitest'
import { fileNameFor } from './paths.mjs'

describe('de ruta a nombre de archivo', () => {
  it('la raíz se llama home', () => {
    expect(fileNameFor('/')).toBe('home.png')
  })

  it('una ruta simple usa su nombre', () => {
    expect(fileNameFor('/muestra')).toBe('muestra.png')
  })

  it('las barras internas se vuelven guiones', () => {
    expect(fileNameFor('/animales/luna-123')).toBe('animales-luna-123.png')
  })

  it('tolera barras de más', () => {
    expect(fileNameFor('//muestra')).toBe('muestra.png')
    expect(fileNameFor('')).toBe('home.png')
  })

  it('la query viaja en el nombre, con guiones', () => {
    expect(fileNameFor('/entrar/enlace?motivo=expired')).toBe('entrar-enlace-motivo-expired.png')
  })

  it('con varios parámetros también', () => {
    expect(fileNameFor('/entrar/enlace?motivo=expired&link=abc')).toBe(
      'entrar-enlace-motivo-expired-link-abc.png',
    )
  })

  it('una barra en la query no abre una carpeta', () => {
    expect(fileNameFor('/verificar-telefono?para=publicar&next=/mi-perfil')).toBe(
      'verificar-telefono-para-publicar-next--mi-perfil.png',
    )
  })

  it('una query vacía no agrega nada', () => {
    expect(fileNameFor('/muestra?')).toBe('muestra.png')
  })

  it('el sufijo de hover va al final', () => {
    expect(fileNameFor('/muestra', { hover: true })).toBe('muestra.hover.png')
  })

  it('el de escritorio va antes del de hover', () => {
    expect(fileNameFor('/muestra', { desktop: true })).toBe('muestra.desktop.png')
    expect(fileNameFor('/muestra', { desktop: true, hover: true })).toBe(
      'muestra.desktop.hover.png',
    )
  })
})
