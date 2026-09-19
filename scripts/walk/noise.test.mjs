import { describe, expect, it } from 'vitest'
import { ALLOWED_FAILED_REQUESTS, classify, isDevServerNoise } from './noise.mjs'

describe('qué es un error de la pantalla y qué es ruido', () => {
  it('la lista permitida está vacía en esta historia', () => {
    expect(ALLOWED_FAILED_REQUESTS).toEqual([])
  })

  it('el ruido del dev server se ignora', () => {
    expect(isDevServerNoise('Download the React DevTools for a better experience')).toBe(true)
    expect(isDevServerNoise('[Fast Refresh] rebuilding')).toBe(true)
  })

  it('un websocket de HMR que falla no es ruido: la página no hidrató', () => {
    expect(
      isDevServerNoise(
        "WebSocket connection to 'ws://127.0.0.1:3000/_next/hmr?id=x' failed: Error during WebSocket handshake",
      ),
    ).toBe(false)
  })

  it('un error de verdad no se ignora', () => {
    expect(isDevServerNoise('TypeError: pet is undefined')).toBe(false)
    expect(classify({ kind: 'console', text: 'TypeError: pet is undefined' })).toEqual({
      kind: 'console',
      text: 'TypeError: pet is undefined',
    })
  })

  it('un pedido fallido cuenta como problema, porque nada está permitido todavía', () => {
    expect(classify({ kind: 'request', text: 'http://localhost:3000/api/pets' })).not.toBeNull()
  })

  it('el ruido gana sobre el tipo de evento', () => {
    expect(
      classify({ kind: 'request', text: 'http://localhost:3000/_next/static/development/x.js' }),
    ).toBeNull()
  })
})
