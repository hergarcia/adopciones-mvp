import { describe, expect, it } from 'vitest'
import { canResend, linkProblemMessage, type LinkProblem } from './link-problem'

const TEXTS = {
  superseded: 'hay uno más nuevo',
  consumed: 'ya se usó',
  expired: 'venció',
  unknown: 'ya no sirve',
  otherAccount: 'estás con otra cuenta',
}

// Covers: US1-AS4, US1-AS5, US1-AS6, FR-005, SC-003. Lo que se prueba es la decisión, no el
// markup: cuál de los mensajes ve la persona y si le queda la acción de pedir otro.
describe('qué se le dice a quien abre un enlace que no sirve', () => {
  it.each([
    ['superseded', TEXTS.superseded],
    ['consumed', TEXTS.consumed],
    ['expired', TEXTS.expired],
    ['otra-cuenta', TEXTS.otherAccount],
  ] as const)('%s tiene su propio mensaje', (problem, expected) => {
    expect(linkProblemMessage(problem, TEXTS)).toBe(expected)
  })

  it('un motivo que no conocemos cae en el general, nunca en una pantalla muda', () => {
    expect(linkProblemMessage('unknown', TEXTS)).toBe(TEXTS.unknown)
    expect(linkProblemMessage('cualquier-cosa', TEXTS)).toBe(TEXTS.unknown)
  })

  it('los cuatro motivos del enlace dicen cosas distintas entre sí', () => {
    const problems: LinkProblem[] = ['superseded', 'consumed', 'expired', 'unknown']
    const messages = problems.map((p) => linkProblemMessage(p, TEXTS))
    expect(new Set(messages).size).toBe(problems.length)
  })
})

describe('qué puede hacer desde esa pantalla', () => {
  it.each(['superseded', 'consumed', 'expired', 'unknown'] as const)(
    'con %s puede pedir otro enlace en un toque',
    (problem) => {
      expect(canResend(problem)).toBe(true)
    },
  )

  it('con la sesión de otra cuenta NO ofrece otro enlace: lo que corresponde es cerrar sesión', () => {
    expect(canResend('otra-cuenta')).toBe(false)
  })
})
