import { describe, expect, it } from 'vitest'
import { ALLOWED_FAILED_REQUESTS, classify, isDevServerNoise } from './noise.mjs'

describe('qué es un error de la pantalla y qué es ruido', () => {
  it('la lista permitida está vacía en esta historia', () => {
    expect(ALLOWED_FAILED_REQUESTS).toEqual([])
  })

  it('el ruido del dev server se ignora', () => {
    expect(isDevServerNoise('http://localhost:3000/_next/webpack-hmr')).toBe(true)
    expect(isDevServerNoise('Download the React DevTools for a better experience')).toBe(true)
    expect(isDevServerNoise('[Fast Refresh] rebuilding')).toBe(true)
    // Next 16 llama a su socket `_next/hmr`, no `webpack-hmr`: la primera corrida del driver
    // falló por esto, y el patrón viejo no lo tomaba.
    expect(
      isDevServerNoise(
        "WebSocket connection to 'ws://127.0.0.1:3000/_next/hmr?id=x' failed: Error during WebSocket handshake",
      ),
    ).toBe(true)
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
      classify({ kind: 'request', text: 'http://localhost:3000/_next/webpack-hmr' }),
    ).toBeNull()
  })
})
