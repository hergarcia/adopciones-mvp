import { describe, expect, it } from 'vitest'
import { migrationSteps } from './migrate.mjs'

const DB_URL = 'postgresql://postgres:clave@adopciones-db:5432/postgres?sslmode=disable'

// Covers: FR-006 y research R3 de #169. El código nuevo no puede salir antes que su base, y el sitio
// de verdad arranca sin los sembrados.
describe('el arranque del contenedor', () => {
  it('en producción empuja las migraciones a la base del servidor', () => {
    expect(migrationSteps({ DEPLOY_ENV: 'production', SUPABASE_DB_URL: DB_URL })).toEqual([
      ['supabase', ['db', 'push', '--db-url', DB_URL, '--yes', '--skip-vault']],
    ])
  })

  it('las migraciones nunca llevan los sembrados', () => {
    const [push] = migrationSteps({ DEPLOY_ENV: 'production', SUPABASE_DB_URL: DB_URL })

    expect(push[1]).not.toContain('--include-seed')
  })

  it('en producción sin la cadena de la base falla y la nombra', () => {
    expect(() => migrationSteps({ DEPLOY_ENV: 'production' })).toThrow(/SUPABASE_DB_URL/)
  })

  it('en producción con la cadena vacía falla igual', () => {
    expect(() => migrationSteps({ DEPLOY_ENV: 'production', SUPABASE_DB_URL: '' })).toThrow(
      /SUPABASE_DB_URL/,
    )
  })

  it('fuera de producción no toca la base, aunque tenga la cadena', () => {
    expect(migrationSteps({ DEPLOY_ENV: 'preview', SUPABASE_DB_URL: DB_URL })).toEqual([])
    expect(migrationSteps({})).toEqual([])
  })
})
