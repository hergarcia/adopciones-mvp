import { describe, expect, it } from 'vitest'
import { buildSteps } from './build.mjs'

const DB_URL =
  'postgresql://postgres.ref:clave@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
const BUILD = ['pnpm', ['build']]

// Covers: FR-006 y research R3. El código nuevo no puede salir antes que su base, y el sitio de
// verdad arranca sin los sembrados.
describe('la construcción de Vercel', () => {
  it('en producción, primero las migraciones y después la compilación', () => {
    const steps = buildSteps({ VERCEL_ENV: 'production', SUPABASE_DB_URL: DB_URL })

    expect(steps).toEqual([
      ['pnpm', ['exec', 'supabase', 'db', 'push', '--db-url', DB_URL, '--yes', '--skip-vault']],
      BUILD,
    ])
  })

  it('las migraciones nunca llevan los sembrados', () => {
    const [push] = buildSteps({ VERCEL_ENV: 'production', SUPABASE_DB_URL: DB_URL })

    expect(push[1]).not.toContain('--include-seed')
  })

  it('en producción sin la cadena de la base falla y la nombra', () => {
    expect(() => buildSteps({ VERCEL_ENV: 'production' })).toThrow(/SUPABASE_DB_URL/)
  })

  it('en producción con la cadena vacía falla igual', () => {
    expect(() => buildSteps({ VERCEL_ENV: 'production', SUPABASE_DB_URL: '' })).toThrow(
      /SUPABASE_DB_URL/,
    )
  })

  it('en una dirección de prueba solo compila, aunque tenga la cadena', () => {
    expect(buildSteps({ VERCEL_ENV: 'preview', SUPABASE_DB_URL: DB_URL })).toEqual([BUILD])
  })

  it('fuera de Vercel solo compila', () => {
    expect(buildSteps({})).toEqual([BUILD])
  })
})
