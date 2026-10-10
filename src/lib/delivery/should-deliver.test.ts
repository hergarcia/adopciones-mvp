import { describe, expect, it } from 'vitest'
import { shouldDeliver } from './should-deliver'

// Covers: FR-027, spec §Edge Cases «Las pruebas no se mezclan». Lo que sale de la máquina del
// equipo, de CI o de una prueba se contaría con el sitio de verdad.
describe('cuándo algo sale a un servicio de afuera', () => {
  it('sin VERCEL_ENV no sale, aunque haya clave', () => {
    expect(shouldDeliver({ VERCEL_ENV: undefined, key: 'phc_clave' })).toBe(false)
  })

  it('en Vercel y sin clave no sale', () => {
    expect(shouldDeliver({ VERCEL_ENV: 'production', key: undefined })).toBe(false)
  })

  it('en producción y con clave sale', () => {
    expect(shouldDeliver({ VERCEL_ENV: 'production', key: 'phc_clave' })).toBe(true)
  })

  it('en una dirección de prueba y con clave sale, marcado como de prueba por quien lo arma', () => {
    expect(shouldDeliver({ VERCEL_ENV: 'preview', key: 'phc_clave' })).toBe(true)
  })

  // `vercel dev` y `vercel env pull` traen `development` a la máquina del equipo.
  it('con `development` no sale, aunque haya clave', () => {
    expect(shouldDeliver({ VERCEL_ENV: 'development', key: 'phc_clave' })).toBe(false)
  })

  it('con VERCEL_ENV vacío no sale', () => {
    expect(shouldDeliver({ VERCEL_ENV: '', key: 'phc_clave' })).toBe(false)
  })
})
