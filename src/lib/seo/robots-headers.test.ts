import { describe, expect, it } from 'vitest'
import { robotsHeaders } from './robots-headers'

// Covers: US1-AS6, FR-002. Lo que entra al índice de un buscador o de un asistente no se retira, y
// mudarse de dominio después tira la autoridad (docs/04).
describe('el encabezado de no indexar', () => {
  it('sin indexación, toda respuesta del sitio dice noindex, nofollow', () => {
    expect(robotsHeaders(false)).toEqual([
      { source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ])
  })

  it('con indexación no agrega nada', () => {
    expect(robotsHeaders(true)).toEqual([])
  })
})
