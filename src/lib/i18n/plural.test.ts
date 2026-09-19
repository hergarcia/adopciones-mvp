import { describe, expect, it } from 'vitest'
import { inSeconds } from './plural'

const FORMS = { one: 'Falta 1 segundo.', many: 'Faltan {seconds} segundos.' }

describe('la forma que le toca a una cuenta regresiva', () => {
  it('en uno, la de singular, sin sustituir nada', () => {
    expect(inSeconds(1, FORMS)).toBe('Falta 1 segundo.')
  })

  it('en dos, la de plural con el número adentro', () => {
    expect(inSeconds(2, FORMS)).toBe('Faltan 2 segundos.')
  })

  it('en sesenta también', () => {
    expect(inSeconds(60, FORMS)).toBe('Faltan 60 segundos.')
  })

  // El cero no se muestra —el botón vuelve a estar disponible— pero si alguna vez llega, «0
  // segundos» es lo correcto y no «1 segundo».
  it('en cero, la de plural', () => {
    expect(inSeconds(0, FORMS)).toBe('Faltan 0 segundos.')
  })
})
