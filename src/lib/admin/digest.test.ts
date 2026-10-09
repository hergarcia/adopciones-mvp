// Covers: FR-061, FR-062, US3-AS1, US3-AS2, spec §Edge Cases (el resumen lista solo las colas con
// algo, las atrasadas primero)
import { readFileSync } from 'node:fs'
import { createTranslator, type Messages } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { digestLines, digestTotal } from './digest'
import type { DigestClaim } from './types'

const HOUR = 3_600_000
const NOW = new Date('2026-10-09T11:00:00.000Z')
const ago = (ms: number) => new Date(NOW.getTime() - ms)
const NONE = { count: 0, oldest: null }

const messages: Messages = JSON.parse(readFileSync('messages/es.json', 'utf8'))
const texts = {
  digest: createTranslator({ locale: 'es', messages, namespace: 'emails.admin_digest' }),
  home: createTranslator({ locale: 'es', messages, namespace: 'admin.home' }),
}

const claim = (queues: Partial<Omit<DigestClaim, 'userId'>>): DigestClaim => ({
  userId: 'f0f0f0f0-0000-4000-8000-000000000000',
  identity: NONE,
  pets: NONE,
  reports: NONE,
  ...queues,
})

describe('digestLines', () => {
  it('dice cuántos reportes y desde cuándo espera el más viejo', () => {
    const lines = digestLines(claim({ reports: { count: 2, oldest: ago(20 * HOUR) } }), NOW, texts)
    expect(lines).toEqual(['2 reportes sin resolver, el más viejo de hace 20 horas.'])
  })

  it('las atrasadas primero, con cuánto se pasaron; después las que están al día', () => {
    const lines = digestLines(
      claim({
        identity: { count: 3, oldest: ago(72 * HOUR) },
        pets: { count: 1, oldest: ago(5 * HOUR) },
      }),
      NOW,
      texts,
    )
    expect(lines).toEqual([
      '3 pedidos de identidad, el más viejo de hace 3 días: atrasada por 1 día.',
      '1 publicación por revisar, el más viejo de hace 5 horas.',
    ])
  })

  it('una atrasada pasa adelante de una al día aunque su lugar fijo sea después', () => {
    const lines = digestLines(
      claim({
        identity: { count: 1, oldest: ago(30 * 60_000) },
        reports: { count: 4, oldest: ago(48 * HOUR + 30 * 60_000) },
      }),
      NOW,
      texts,
    )
    expect(lines).toEqual([
      '4 reportes sin resolver, el más viejo de hace 2 días: atrasada por menos de 1 hora.',
      '1 pedido de identidad, el más viejo de hace menos de 1 hora.',
    ])
  })

  it('las tres al día van en su orden fijo', () => {
    const lines = digestLines(
      claim({
        identity: { count: 1, oldest: ago(HOUR) },
        pets: { count: 2, oldest: ago(2 * HOUR) },
        reports: { count: 1, oldest: ago(30 * HOUR) },
      }),
      NOW,
      texts,
    )
    expect(lines).toEqual([
      '1 pedido de identidad, el más viejo de hace 1 hora.',
      '2 publicaciones por revisar, el más viejo de hace 2 horas.',
      '1 reporte sin resolver, el más viejo de hace 1 día.',
    ])
  })

  it('una cola atrasada por horas lo dice en horas', () => {
    const lines = digestLines(claim({ pets: { count: 5, oldest: ago(29 * HOUR) } }), NOW, texts)
    expect(lines).toEqual([
      '5 publicaciones por revisar, el más viejo de hace 1 día: atrasada por 5 horas.',
    ])
  })

  it('sin nada que resolver no hay ninguna línea', () => {
    expect(digestLines(claim({}), NOW, texts)).toEqual([])
  })
})

describe('digestTotal', () => {
  it('suma lo que espera en las tres colas', () => {
    expect(
      digestTotal(
        claim({
          identity: { count: 3, oldest: ago(HOUR) },
          pets: { count: 1, oldest: ago(HOUR) },
          reports: { count: 2, oldest: ago(HOUR) },
        }),
      ),
    ).toBe(6)
  })
})
