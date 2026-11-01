// Covers: #267 criterio 5. Si esto se rompe, la línea «vuelve con el aviso guardado» le promete un
// aviso a quien entra para solicitar o publicar, o se le esconde a quien sí lo pidió.
import { describe, expect, it } from 'vitest'
import { withAlertParam } from './paths'
import { isAlertReturn } from './alert-return'

describe('isAlertReturn', () => {
  it('el listado con la marca, con filtros o sin ellos', () => {
    expect(isAlertReturn(withAlertParam('/animales'))).toBe(true)
    expect(isAlertReturn(withAlertParam('/animales?especie=perro&tamano=chico'))).toBe(true)
  })

  it('el listado sin la marca', () => {
    expect(isAlertReturn('/animales')).toBe(false)
    expect(isAlertReturn('/animales?especie=perro')).toBe(false)
    expect(isAlertReturn('/animales?especie=avisar')).toBe(false)
  })

  it('otra pantalla con la marca no es un aviso: solicitar, el perfil, una ficha', () => {
    expect(isAlertReturn('/mi-perfil?avisar=1')).toBe(false)
    expect(isAlertReturn('/animales/abc123?avisar=1')).toBe(false)
    expect(isAlertReturn('/mis-animales/publicar?avisar=1')).toBe(false)
  })
})
