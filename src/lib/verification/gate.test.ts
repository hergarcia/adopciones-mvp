import { describe, expect, it } from 'vitest'
import {
  NO_GATE,
  cancelReturnPath,
  claimPath,
  codePath,
  codeScreen,
  gateCheck,
  gateScreen,
  inUsePath,
  isClaiming,
  notNowDestination,
  numberInUsePath,
  parseGate,
  signInPath,
  validPath,
  verifiedDestination,
  verifyPath,
  type Gate,
} from './gate'
import type { PhoneStatus } from './phone-status'

const SINCE = new Date('2026-09-20T14:00:00-03:00')
const VERIFIED: PhoneStatus = { kind: 'verified', number: '+59899123456', since: SINCE }
const NONE: PhoneStatus = { kind: 'none' }
const PENDING: PhoneStatus = { kind: 'pending', number: '+59898765432' }
const CHANGE: PhoneStatus = {
  kind: 'pending_change',
  number: '+59898765432',
  previous: { number: '+59899123456', since: SINCE },
}
const PUBLISH: Gate = { reason: 'publish', next: '/publicar', from: '/animales/tobi' }

// Covers: FR-013b, FR-013e. Si se equivoca, es un redirect abierto.
describe('una ruta de este sitio', () => {
  it('pasa tal cual', () => {
    expect(validPath('/mi-perfil/editar')).toBe('/mi-perfil/editar')
    expect(validPath('/animales?especie=perro')).toBe('/animales?especie=perro')
  })

  it.each([null, undefined, '', 'https://otro.com', '//otro.com', '/\\otro.com', 'mi-perfil'])(
    '«%s» no',
    (candidate) => {
      expect(validPath(candidate)).toBeNull()
    },
  )
})

// Covers: FR-013a, FR-013f
describe('la puerta, leída de la URL', () => {
  it('publicar y solicitar son las dos acciones', () => {
    expect(parseGate({ para: 'publicar' }).reason).toBe('publish')
    expect(parseGate({ para: 'solicitar' }).reason).toBe('apply')
  })

  // Covers: FR-002 (historia #11)
  it('pedir la verificación de identidad también', () => {
    expect(parseGate({ para: 'identidad' }).reason).toBe('identity')
    expect(parseGate({ para: 'identity' }).reason).toBeNull()
  })

  it('una acción desconocida, o ninguna, se ignora', () => {
    expect(parseGate({ para: 'borrar' }).reason).toBeNull()
    expect(parseGate({ para: 'apply' }).reason).toBeNull()
    expect(parseGate({}).reason).toBeNull()
  })

  it('el destino y el origen ajenos se descartan', () => {
    expect(parseGate({ next: 'https://otro.com', desde: '//otro.com' })).toEqual(NO_GATE)
    expect(parseGate({ para: 'publicar', next: '/publicar', desde: '/animales/tobi' })).toEqual(
      PUBLISH,
    )
  })
})

// Covers: FR-013c, FR-013e
describe('las URL de las dos pantallas', () => {
  it('sin puerta, la ruta a secas', () => {
    expect(verifyPath(NO_GATE)).toBe('/verificar-telefono')
    expect(codePath(NO_GATE)).toBe('/verificar-telefono/codigo')
  })

  it('con puerta, conservan la acción, el destino y el origen', () => {
    expect(verifyPath(PUBLISH)).toBe(
      '/verificar-telefono?para=publicar&next=%2Fpublicar&desde=%2Fanimales%2Ftobi',
    )
    expect(codePath({ reason: 'apply', next: '/solicitar?animal=tobi', from: null })).toBe(
      '/verificar-telefono/codigo?para=solicitar&next=%2Fsolicitar%3Fanimal%3Dtobi',
    )
  })

  it('un destino sin acción también viaja', () => {
    expect(verifyPath({ reason: null, next: '/mi-perfil/editar', from: null })).toBe(
      '/verificar-telefono?next=%2Fmi-perfil%2Feditar',
    )
  })

  it('lo que sale de la URL vuelve a ser la misma puerta', () => {
    const query = Object.fromEntries(new URL(verifyPath(PUBLISH), 'http://x').searchParams)
    expect(parseGate(query)).toEqual(PUBLISH)
  })
})

// Covers: #25 FR-003, FR-006, FR-009c. Sin la puerta, «Seguir» y el destino se pierden en el camino.
describe('las URL de «Ese número está en otra cuenta» y de la confirmación', () => {
  it('sin puerta, la ruta a secas', () => {
    expect(inUsePath(NO_GATE)).toBe('/verificar-telefono/en-otra-cuenta')
    expect(claimPath(NO_GATE)).toBe('/verificar-telefono/quedarme')
  })

  it('con puerta, conservan la acción, el destino y el origen', () => {
    expect(inUsePath(PUBLISH)).toBe(
      '/verificar-telefono/en-otra-cuenta?para=publicar&next=%2Fpublicar&desde=%2Fanimales%2Ftobi',
    )
    expect(claimPath(PUBLISH)).toBe(
      '/verificar-telefono/quedarme?para=publicar&next=%2Fpublicar&desde=%2Fanimales%2Ftobi',
    )
  })

  it('la marca de que no se pudo cerrar la sesión se suma sin perder la puerta', () => {
    expect(inUsePath(PUBLISH, { error: 'salir' })).toBe(
      '/verificar-telefono/en-otra-cuenta?para=publicar&next=%2Fpublicar&desde=%2Fanimales%2Ftobi&error=salir',
    )
    expect(inUsePath(NO_GATE, { error: 'salir' })).toBe(
      '/verificar-telefono/en-otra-cuenta?error=salir',
    )
  })

  it('«Entrar» lleva solo el destino de la puerta', () => {
    expect(signInPath(PUBLISH)).toBe('/entrar?next=%2Fpublicar')
    expect(signInPath({ reason: null, next: '/solicitar?animal=tobi', from: '/x' })).toBe(
      '/entrar?next=%2Fsolicitar%3Fanimal%3Dtobi',
    )
  })

  it('el código pedido para quedarse con el número lleva la marca, sin perder la puerta', () => {
    expect(codePath(PUBLISH, { claiming: true })).toBe(
      '/verificar-telefono/codigo?para=publicar&next=%2Fpublicar&desde=%2Fanimales%2Ftobi&quedarme=1',
    )
    expect(codePath(NO_GATE, { claiming: false })).toBe('/verificar-telefono/codigo')
    const query = Object.fromEntries(
      new URL(codePath(PUBLISH, { claiming: true }), 'http://x').searchParams,
    )
    expect(isClaiming(query)).toBe(true)
    expect(parseGate(query)).toEqual(PUBLISH)
  })

  it('sin la marca, o con otro valor, no se está quedando con el número', () => {
    expect(isClaiming({})).toBe(false)
    expect(isClaiming({ quedarme: '' })).toBe(false)
    expect(isClaiming({ quedarme: 'si' })).toBe(false)
  })

  it('con la marca, el número en otra cuenta lleva a la confirmación; sin ella, a los tres caminos', () => {
    expect(numberInUsePath(PUBLISH, true)).toBe(claimPath(PUBLISH))
    expect(numberInUsePath(PUBLISH, false)).toBe(inUsePath(PUBLISH))
  })

  it('«Entrar» sin destino, o con uno ajeno, sin consulta', () => {
    expect(signInPath(NO_GATE)).toBe('/entrar')
    expect(signInPath(parseGate({ para: 'publicar', next: 'https://otro.com' }))).toBe('/entrar')
  })
})

// Covers: FR-013b, FR-018a, FR-013e
describe('adónde se va', () => {
  it('al verificar, a la acción; sin ella, a «Mi perfil» con la confirmación', () => {
    expect(verifiedDestination(PUBLISH)).toBe('/publicar')
    expect(verifiedDestination(NO_GATE)).toBe('/mi-perfil?guardado=telefono')
  })

  it('con «Ahora no», a donde estaba; si no se sabe, al inicio', () => {
    expect(notNowDestination(PUBLISH)).toBe('/animales/tobi')
    expect(notNowDestination(NO_GATE)).toBe('/')
  })
})

// Covers: FR-015a
describe('la vuelta después de cancelar', () => {
  it('a la misma pantalla, con la marca de que se canceló', () => {
    expect(cancelReturnPath('/mi-perfil', true)).toBe('/mi-perfil?guardado=cancelado')
  })

  it('sobre una pantalla que ya tiene su consulta, la suma', () => {
    expect(cancelReturnPath(verifyPath(PUBLISH), true)).toBe(
      '/verificar-telefono?para=publicar&next=%2Fpublicar&desde=%2Fanimales%2Ftobi&guardado=cancelado',
    )
  })

  it('si falló, con la marca del error', () => {
    expect(cancelReturnPath('/verificar-telefono', false)).toBe(
      '/verificar-telefono?error=cancelar',
    )
  })

  it('con un origen ajeno o ninguno, a «Mi perfil»', () => {
    expect(cancelReturnPath('https://otro.com', true)).toBe('/mi-perfil?guardado=cancelado')
    expect(cancelReturnPath(null, false)).toBe('/mi-perfil?error=cancelar')
  })

  it('una ruta que al normalizarse sale del sitio, también a «Mi perfil»', () => {
    expect(cancelReturnPath('/.//otro.com', true)).toBe('/mi-perfil?guardado=cancelado')
    expect(cancelReturnPath('/a/..//otro.com', false)).toBe('/mi-perfil?error=cancelar')
  })
})

// Covers: FR-013, FR-013d, US2-AS1, US2-AS3
describe('la compuerta de publicar y solicitar', () => {
  it('con nivel 1 pasa', () => {
    expect(gateCheck(VERIFIED, { path: '/publicar', reason: 'publish' })).toEqual({ pass: true })
  })

  it('sin nivel 1 manda al aviso con la acción, la vuelta y el origen', () => {
    expect(
      gateCheck(NONE, { path: '/publicar', reason: 'publish', from: '/animales/tobi' }),
    ).toEqual({ pass: false, gatePath: verifyPath(PUBLISH) })
  })

  it('un cambio a medias tampoco pasa', () => {
    expect(gateCheck(CHANGE, { path: '/solicitar', reason: 'apply' })).toEqual({
      pass: false,
      gatePath: '/verificar-telefono?para=solicitar&next=%2Fsolicitar',
    })
  })

  // Covers: FR-002 (historia #11), US1-AS8. Al verificar el teléfono vuelve a pedir la identidad, y
  // «Ahora no» lleva a «Mi perfil».
  it('pedir la identidad sin nivel 1 lleva al aviso con la acción, la vuelta y el origen', () => {
    const check = gateCheck(NONE, {
      path: '/verificar-identidad?desde=perfil',
      reason: 'identity',
      from: '/mi-perfil',
    })
    expect(check).toEqual({
      pass: false,
      gatePath:
        '/verificar-telefono?para=identidad&next=%2Fverificar-identidad%3Fdesde%3Dperfil&desde=%2Fmi-perfil',
    })
    const gate = parseGate({
      para: 'identidad',
      next: '/verificar-identidad?desde=perfil',
      desde: '/mi-perfil',
    })
    expect(verifiedDestination(gate)).toBe('/verificar-identidad?desde=perfil')
    expect(notNowDestination(gate)).toBe('/mi-perfil')
  })

  it('una ruta o un origen ajenos no viajan', () => {
    expect(gateCheck(PENDING, { path: 'https://otro.com', reason: 'apply', from: '//x' })).toEqual({
      pass: false,
      gatePath: '/verificar-telefono?para=solicitar',
    })
  })
})

// Covers: FR-013d, FR-015a, Edge Cases «Pantalla del código sin número a medias»
describe('qué hace cada pantalla', () => {
  it('el aviso, con nivel 1, deja pasar a la acción', () => {
    expect(gateScreen(VERIFIED, PUBLISH)).toEqual({ render: false, redirect: '/publicar' })
  })

  it('el aviso, con nivel 1 y sin destino, a donde estaba o a «Mi perfil» sin marca', () => {
    expect(gateScreen(VERIFIED, { reason: 'publish', next: null, from: '/animales/tobi' })).toEqual(
      { render: false, redirect: '/animales/tobi' },
    )
    expect(gateScreen(VERIFIED, { reason: 'publish', next: null, from: null })).toEqual({
      render: false,
      redirect: '/mi-perfil',
    })
  })

  it('el aviso sin nivel 1, o «Verificar teléfono» sin puerta, se muestran', () => {
    expect(gateScreen(NONE, PUBLISH)).toEqual({ render: true })
    expect(gateScreen(CHANGE, PUBLISH)).toEqual({ render: true })
    expect(gateScreen(VERIFIED, NO_GATE)).toEqual({ render: true })
  })

  it('«Escribir el código» se muestra con un número a medias', () => {
    expect(codeScreen(PENDING, PUBLISH)).toEqual({ render: true })
    expect(codeScreen(CHANGE, NO_GATE)).toEqual({ render: true })
  })

  it('sin número a medias y verificada, a su destino', () => {
    expect(codeScreen(VERIFIED, PUBLISH)).toEqual({ render: false, redirect: '/publicar' })
  })

  it('sin número a medias y sin destino, a verificar con la misma puerta', () => {
    expect(codeScreen(VERIFIED, NO_GATE)).toEqual({
      render: false,
      redirect: '/verificar-telefono',
    })
    expect(codeScreen(NONE, PUBLISH)).toEqual({ render: false, redirect: verifyPath(PUBLISH) })
  })
})
