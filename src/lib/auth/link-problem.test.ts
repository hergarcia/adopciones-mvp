import { describe, expect, it } from 'vitest'
import { canResend, linkProblemMessage, linkProblemPath, type LinkProblem } from './link-problem'

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

const LINK = '6f1c2a4e-0000-4000-8000-000000000001'

// Covers: FR-001, US1-AS1, US1-AS9. La URL de «El enlace no sirve» es la que lleva el destino hasta
// «Enviarme otro enlace»: si lo pierde, el enlace nuevo deja a la persona en Mi perfil; si deja
// pasar uno de otro sitio, el enlace nuevo lo manda afuera.
describe('a dónde va quien abre un enlace que no sirve', () => {
  it('sin id ni destino, solo el motivo', () => {
    expect(linkProblemPath('unknown', null, null)).toBe('/entrar/enlace?motivo=unknown')
  })

  it('con id y sin destino, como hoy', () => {
    expect(linkProblemPath('expired', LINK, null)).toBe(
      `/entrar/enlace?motivo=expired&link=${LINK}`,
    )
  })

  it('con id y destino, lleva los dos', () => {
    expect(linkProblemPath('consumed', LINK, '/mis-animales/publicar')).toBe(
      `/entrar/enlace?motivo=consumed&link=${LINK}&next=%2Fmis-animales%2Fpublicar`,
    )
  })

  it('sin id, el destino viaja igual', () => {
    expect(linkProblemPath('unknown', null, '/mis-animales/publicar')).toBe(
      '/entrar/enlace?motivo=unknown&next=%2Fmis-animales%2Fpublicar',
    )
  })

  it.each([
    ['de otro sitio', 'https://otro.com'],
    ['con host', '//otro.com'],
    ['que es Mi perfil', '/mi-perfil'],
  ])('un destino %s no aparece', (_caso, next) => {
    expect(linkProblemPath('superseded', LINK, next)).toBe(
      `/entrar/enlace?motivo=superseded&link=${LINK}`,
    )
  })

  it('un destino con su propia consulta no pisa los otros parámetros', () => {
    const url = new URL(
      linkProblemPath('expired', LINK, '/animales?especie=perro&motivo=x'),
      'http://sitio',
    )
    expect(url.searchParams.get('motivo')).toBe('expired')
    expect(url.searchParams.get('link')).toBe(LINK)
    expect(url.searchParams.get('next')).toBe('/animales?especie=perro&motivo=x')
  })
})
