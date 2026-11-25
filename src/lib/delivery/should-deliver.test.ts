import { describe, expect, it } from 'vitest'
import { shouldDeliver } from './should-deliver'

// Covers: FR-027, spec §Edge Cases «Las pruebas no se mezclan». Lo que sale de la máquina del
// equipo, de CI o de una prueba se contaría con el sitio de verdad.
describe('cuándo algo sale a un servicio de afuera', () => {
  it('sin DEPLOY_ENV no sale, aunque haya clave', () => {
    expect(shouldDeliver({ DEPLOY_ENV: undefined, key: 'phc_clave' })).toBe(false)
  })

  it('en producción y sin clave no sale', () => {
    expect(shouldDeliver({ DEPLOY_ENV: 'production', key: undefined })).toBe(false)
  })

  it('en producción y con clave sale', () => {
    expect(shouldDeliver({ DEPLOY_ENV: 'production', key: 'phc_clave' })).toBe(true)
  })

  it('en una dirección de prueba y con clave sale, marcado como de prueba por quien lo arma', () => {
    expect(shouldDeliver({ DEPLOY_ENV: 'preview', key: 'phc_clave' })).toBe(true)
  })

  // Un `.env` copiado del servidor con otro valor no tiene que mandar nada desde la máquina del equipo.
  it('con `development` no sale, aunque haya clave', () => {
    expect(shouldDeliver({ DEPLOY_ENV: 'development', key: 'phc_clave' })).toBe(false)
  })

  it('con DEPLOY_ENV vacío no sale', () => {
    expect(shouldDeliver({ DEPLOY_ENV: '', key: 'phc_clave' })).toBe(false)
  })
})
