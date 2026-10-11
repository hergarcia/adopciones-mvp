import { afterEach, describe, expect, it, vi } from 'vitest'
import { isCronRequest } from './is-cron-request'

const SECRET = 'secreto-de-las-tareas'

afterEach(() => {
  vi.unstubAllEnvs()
})

function request(headers: Record<string, string> = {}) {
  return new Request('https://sitio.test/api/cron/vigilancia', { headers })
}

// Covers: FR-040, contracts §3. Las rutas de las tareas mandan correos y avisos: abiertas, cualquiera
// los dispararía. La base llama con `x-cron-secret`; Vercel Cron, con `Authorization: Bearer`.
describe('quién puede disparar una tarea', () => {
  it('la base, con el secreto en x-cron-secret', () => {
    vi.stubEnv('CRON_SECRET', SECRET)
    expect(isCronRequest(request({ 'x-cron-secret': SECRET }))).toBe(true)
  })

  it('Vercel Cron, con el secreto como Bearer', () => {
    vi.stubEnv('CRON_SECRET', SECRET)
    expect(isCronRequest(request({ authorization: `Bearer ${SECRET}` }))).toBe(true)
  })

  it.each([
    ['otro secreto del mismo largo', { 'x-cron-secret': SECRET.replace('s', 'z') }],
    ['un secreto más corto', { 'x-cron-secret': SECRET.slice(1) }],
    ['un secreto vacío', { 'x-cron-secret': '' }],
    ['otro secreto como Bearer', { authorization: `Bearer ${SECRET.slice(1)}` }],
    ['Bearer sin valor', { authorization: 'Bearer ' }],
    ['el secreto con otro esquema', { authorization: `Basic ${SECRET}` }],
    ['el secreto sin esquema', { authorization: SECRET }],
    ['ningún encabezado', {}],
  ])('nadie con %s', (_, headers) => {
    vi.stubEnv('CRON_SECRET', SECRET)
    expect(isCronRequest(request(headers))).toBe(false)
  })

  it.each([
    ['vacío', ''],
    ['ausente', undefined],
  ])('con el secreto %s en el entorno, nadie', (_, secret) => {
    vi.stubEnv('CRON_SECRET', secret)
    expect(isCronRequest(request({ 'x-cron-secret': '' }))).toBe(false)
    expect(isCronRequest(request({ authorization: 'Bearer ' }))).toBe(false)
    expect(isCronRequest(request({ authorization: 'Bearer undefined' }))).toBe(false)
  })
})
