// Covers: US1-AS1, US1-AS2 (el origen y el destino de la identidad), US2-AS1, US2-AS7 (el origen
// y el destino del teléfono), FR-007, R5, R6
import { describe, expect, it } from 'vitest'
import { NO_GATE, type Gate } from './gate'
import {
  ALL_EXIT_OPTIONS,
  EXIT_OPTIONS,
  exitDestination,
  exitOrigin,
  exitPlaceOf,
  isExitOption,
  isQuestionShown,
  exitQuestionPath,
  notNowTarget,
  returnCodeOf,
  type ExitPlace,
} from './exit-question'

const LUNA = 'abcdefghjk'

function place(gate: Partial<Gate> = {}, returnCode: string | null = null): ExitPlace {
  return { gate: { ...NO_GATE, ...gate }, returnCode }
}

describe('las opciones de cada nivel', () => {
  it('cinco por nivel, en el orden de la historia, con «Otra cosa» última', () => {
    expect(EXIT_OPTIONS.phone).toEqual(['no_number', 'no_code', 'later', 'groups', 'other'])
    expect(EXIT_OPTIONS.identity).toEqual(['no_id_photos', 'later', 'too_much', 'groups', 'other'])
  })

  it('todas juntas, sin repetir', () => {
    expect(new Set(ALL_EXIT_OPTIONS)).toEqual(
      new Set([...EXIT_OPTIONS.phone, ...EXIT_OPTIONS.identity]),
    )
    expect(ALL_EXIT_OPTIONS).toHaveLength(new Set(ALL_EXIT_OPTIONS).size)
  })

  it('una opción es de su nivel y no del otro', () => {
    expect(isExitOption('identity', 'no_id_photos')).toBe(true)
    expect(isExitOption('phone', 'no_id_photos')).toBe(false)
    expect(isExitOption('phone', 'no_code')).toBe(true)
    expect(isExitOption('identity', 'no_code')).toBe(false)
    expect(isExitOption('identity', 'other')).toBe(true)
  })
})

describe('returnCodeOf', () => {
  it('un código de animal válido', () => {
    expect(returnCodeOf(LUNA)).toBe(LUNA)
  })

  it('nada, vacío o un código que no es', () => {
    expect(returnCodeOf(null)).toBeNull()
    expect(returnCodeOf(undefined)).toBeNull()
    expect(returnCodeOf('')).toBeNull()
    expect(returnCodeOf('luna')).toBeNull()
    expect(returnCodeOf(`${LUNA}x`)).toBeNull()
  })
})

describe('exitPlaceOf: la puerta y el animal salen de la pantalla que postea', () => {
  it('el pedido de identidad desde un animal', () => {
    expect(exitPlaceOf(`/verificar-identidad?pedir=1&animal=${LUNA}`)).toEqual(place({}, LUNA))
  })

  it('la puerta del teléfono, con sus tres partes', () => {
    expect(
      exitPlaceOf(
        `/verificar-telefono?para=publicar&next=${encodeURIComponent('/mis-animales/publicar')}&desde=${encodeURIComponent('/mis-animales')}`,
      ),
    ).toEqual(place({ reason: 'publish', next: '/mis-animales/publicar', from: '/mis-animales' }))
  })

  it('sin consulta, sin pantalla o con una que no es de este sitio: sin puerta ni animal', () => {
    expect(exitPlaceOf('/verificar-identidad')).toEqual(place())
    expect(exitPlaceOf(null)).toEqual(place())
    expect(exitPlaceOf(`https://otro.com/?para=publicar&animal=${LUNA}`)).toEqual(place())
  })

  it('un animal con un código que no es no cuenta', () => {
    expect(exitPlaceOf('/verificar-identidad?animal=luna').returnCode).toBeNull()
  })
})

describe('exitOrigin de la identidad', () => {
  it('con el animal de vuelta: solicitar', () => {
    expect(exitOrigin('identity', place({}, LUNA))).toBe('apply')
  })

  it('sin animal: por su cuenta, aunque traiga una puerta', () => {
    expect(exitOrigin('identity', place())).toBe('self')
    expect(exitOrigin('identity', place({ reason: 'publish' }))).toBe('self')
  })
})

describe('exitOrigin del teléfono', () => {
  it('por la puerta de publicar o de solicitar', () => {
    expect(exitOrigin('phone', place({ reason: 'publish' }))).toBe('publish')
    expect(exitOrigin('phone', place({ reason: 'apply' }))).toBe('apply')
  })

  it('por la de la identidad pedida desde la ficha de un animal: solicitar', () => {
    expect(exitOrigin('phone', place({ reason: 'identity', from: `/animales/${LUNA}` }))).toBe(
      'apply',
    )
  })

  it('por la de la identidad desde otro lado: por su cuenta', () => {
    for (const from of [null, '/mi-perfil', '/animales', '/animales/luna', `/x/animales/${LUNA}`]) {
      expect(exitOrigin('phone', place({ reason: 'identity', from }))).toBe('self')
    }
  })

  it('avalar, aceptar, sin puerta o con el animal del pedido: por su cuenta', () => {
    expect(exitOrigin('phone', place({ reason: 'vouch' }))).toBe('self')
    expect(exitOrigin('phone', place({ reason: 'accept', from: `/animales/${LUNA}` }))).toBe('self')
    expect(exitOrigin('phone', place())).toBe('self')
    expect(exitOrigin('phone', place({}, LUNA))).toBe('self')
  })
})

describe('exitDestination', () => {
  it('identidad: la ficha del animal, o Mi perfil sin él', () => {
    expect(exitDestination('identity', place({}, LUNA))).toBe(`/animales/${LUNA}`)
    expect(exitDestination('identity', place({ reason: 'apply', from: '/x' }))).toBe('/mi-perfil')
  })

  it('teléfono con la puerta: a donde estaba, o al inicio', () => {
    expect(exitDestination('phone', place({ reason: 'publish', from: '/mis-animales' }))).toBe(
      '/mis-animales',
    )
    expect(exitDestination('phone', place({ reason: 'vouch' }))).toBe('/')
  })

  it('teléfono por la puerta de solicitar o de aceptar: a la pantalla de la acción', () => {
    const from = `/animales/${LUNA}`
    expect(exitDestination('phone', place({ reason: 'apply', from }))).toBe(from)
    expect(exitDestination('phone', place({ reason: 'accept', from: '/mis-animales' }))).toBe(
      '/mis-animales',
    )
  })

  it('teléfono sin puerta: Mi perfil', () => {
    expect(exitDestination('phone', place({}, LUNA))).toBe('/mi-perfil')
  })
})

describe('exitQuestionPath: la misma pantalla con la marca', () => {
  it('conserva la consulta de la pantalla', () => {
    expect(exitQuestionPath('identity', `/verificar-identidad?pedir=1&animal=${LUNA}`)).toBe(
      `/verificar-identidad?pedir=1&animal=${LUNA}&pregunta=1`,
    )
    expect(exitQuestionPath('phone', '/verificar-telefono/codigo?para=publicar')).toBe(
      '/verificar-telefono/codigo?para=publicar&pregunta=1',
    )
  })

  it('no la repite si ya estaba', () => {
    expect(exitQuestionPath('identity', '/verificar-identidad?pregunta=1')).toBe(
      '/verificar-identidad?pregunta=1',
    )
  })

  it('sin pantalla válida, la del nivel', () => {
    expect(exitQuestionPath('identity', null)).toBe('/verificar-identidad?pregunta=1')
    expect(exitQuestionPath('phone', 'https://otro.com/x')).toBe('/verificar-telefono?pregunta=1')
    expect(exitQuestionPath('phone', '/.//otro.com')).toBe('/verificar-telefono?pregunta=1')
  })
})

describe('isQuestionShown', () => {
  it('solo con la marca en 1', () => {
    expect(isQuestionShown({ pregunta: '1' })).toBe(true)
    expect(isQuestionShown({ pregunta: '0' })).toBe(false)
    expect(isQuestionShown({})).toBe(false)
  })
})

describe('notNowTarget', () => {
  const where = { from: '/verificar-telefono?para=publicar', href: '/mis-animales' }

  it('con la pregunta pendiente, el botón que pregunta desde esta pantalla', () => {
    expect(notNowTarget(true, where)).toEqual({ ask: true, from: where.from })
  })

  it('sin ella, el enlace al destino', () => {
    expect(notNowTarget(false, where)).toEqual({ ask: false, href: where.href })
  })
})
