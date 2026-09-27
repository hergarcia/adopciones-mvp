// Covers: FR-025 y el Edge Case «Salir del formulario con fotos elegidas sin publicar (volver
// atrás)».
import { describe, expect, it } from 'vitest'
import { cleanAction, isSentinel, popAction, sentinelState, shouldPushSentinel } from './back-guard'

const next = { __NA: true, tree: ['/mis-animales/publicar'] }
const sentinel = sentinelState(next)

describe('la centinela', () => {
  it('conserva el state que había y suma la marca', () => {
    expect(sentinel).toEqual({ __NA: true, tree: ['/mis-animales/publicar'], unsavedGuard: true })
    expect(sentinelState(null)).toEqual({ unsavedGuard: true })
    expect(sentinelState('texto')).toEqual({ unsavedGuard: true })
  })

  it('se reconoce solo con la marca en true', () => {
    expect(isSentinel(sentinel)).toBe(true)
    expect(isSentinel(next)).toBe(false)
    expect(isSentinel({ unsavedGuard: 'true' })).toBe(false)
    expect(isSentinel(null)).toBe(false)
    expect(isSentinel(undefined)).toBe(false)
  })

  it('se empuja solo si no está arriba', () => {
    expect(shouldPushSentinel(next)).toBe(true)
    expect(shouldPushSentinel(null)).toBe(true)
    expect(shouldPushSentinel(sentinel)).toBe(false)
  })
})

describe('popAction', () => {
  it('volver desde la centinela con cambios pregunta', () => {
    expect(popAction(next, true)).toBe('ask')
    expect(popAction(null, true)).toBe('ask')
  })

  it('llegar a la centinela, o sin guardia, no pregunta', () => {
    expect(popAction(sentinel, true)).toBe('ignore')
    expect(popAction(next, false)).toBe('ignore')
  })
})

describe('cleanAction', () => {
  it('sin cambios retira la centinela solo si sigue arriba', () => {
    expect(cleanAction(sentinel)).toBe('retreat')
    expect(cleanAction(next)).toBe('stay')
    expect(cleanAction(null)).toBe('stay')
  })
})
