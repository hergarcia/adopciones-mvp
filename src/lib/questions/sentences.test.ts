// Covers: FR-002, SC-001 (el primer párrafo de cada página tiene de 1 a 3 oraciones)
import { describe, expect, it } from 'vitest'
import { sentenceCount } from './sentences'

describe('sentenceCount', () => {
  it.each([
    ['Una sola.', 1],
    ['Una. Dos.', 2],
    ['¿Una? Dos. ¡Tres!', 3],
    ['Una. ¿Dos? ¡Tres! Cuatro.', 4],
    ['Sin punto final', 1],
    ['Una. Y la otra sin punto', 2],
  ])('cuenta las que cierran en punto, pregunta o exclamación: %s', (text, count) => {
    expect(sentenceCount(text)).toBe(count)
  })

  it.each([
    ['Lo dice el art. 5 de la ley.'],
    ['Lo dicen los arts. 5 y 6.'],
    ['Lo dice el inc. 2 del artículo.'],
    ['Es la resolución n.º 3 del año.'],
    ['Es la resolución nro. 3 del año.'],
    ['Es la resolución núm. 3 del año.'],
    ['Lo firma la Dr. Pérez.'],
    ['Lo firma la Dra. Pérez.'],
    ['Lo firma el Sr. Pérez.'],
    ['Lo firma la Sra. Pérez.'],
    ['Perros, gatos, etc. también.'],
    ['Algo, p. ej. un perro.'],
    ['Lo dice la Ley 18.471 con detalle.'],
    ['Pesa 2,5 kilos.'],
    ['Se anota en el R.E.N.A.C. del instituto.'],
    ['Lo organiza la A.C. del barrio.'],
  ])('un punto que no cierra no cuenta: %s', (text) => {
    expect(sentenceCount(text)).toBe(1)
  })

  it('una abreviatura sola es una oración', () => {
    expect(sentenceCount('Etc.')).toBe(1)
  })

  it('sin distinguir mayúsculas en las abreviaturas', () => {
    expect(sentenceCount('Lo dice el ART. 5 y DR. Pérez.')).toBe(1)
  })

  it('una abreviatura dentro de otra palabra sí cierra', () => {
    expect(sentenceCount('Es un dart. Otro.')).toBe(2)
  })

  it('una palabra con un punto no es una sigla', () => {
    expect(sentenceCount('Es así. Otro.')).toBe(2)
  })

  it('el número al final de una oración la cierra', () => {
    expect(sentenceCount('Es la Ley 18.471. Otra.')).toBe(2)
  })

  it('la pregunta cierra aunque la siga una comilla', () => {
    expect(sentenceCount('Dijo «¿Ya?» Y siguió.')).toBe(2)
  })

  it('varios signos juntos son un solo cierre', () => {
    expect(sentenceCount('¿¡En serio?! Sí.')).toBe(2)
  })

  it('el texto vacío no tiene oraciones', () => {
    expect(sentenceCount('')).toBe(0)
    expect(sentenceCount('   ')).toBe(0)
  })

  it('los espacios finales no suman una oración', () => {
    expect(sentenceCount('Una. Dos.   \n')).toBe(2)
  })
})
