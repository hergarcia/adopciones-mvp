import { describe, expect, it } from 'vitest'
import { linkStatus, type LinkRecord } from './link-status'

const NOW = new Date('2026-09-19T12:00:00Z')

function link(overrides: Partial<LinkRecord> = {}): LinkRecord {
  return {
    expiresAt: new Date('2026-09-19T12:30:00Z'),
    consumedAt: null,
    supersededAt: null,
    ...overrides,
  }
}

// Covers: US1-AS4, US1-AS5, US1-AS6, FR-005, FR-005a
describe('por qué un enlace no entra', () => {
  it('un enlace vivo y sin usar sirve', () => {
    expect(linkStatus(link(), NOW)).toBe('usable')
  })

  it('un enlace que no está registrado no se puede explicar, y se dice así', () => {
    expect(linkStatus(null, NOW)).toBe('unknown')
  })

  it('el que fue reemplazado por uno más nuevo', () => {
    expect(linkStatus(link({ supersededAt: new Date('2026-09-19T11:50:00Z') }), NOW)).toBe(
      'superseded',
    )
  })

  it('el que ya se usó una vez', () => {
    expect(linkStatus(link({ consumedAt: new Date('2026-09-19T11:50:00Z') }), NOW)).toBe('consumed')
  })

  it('el que venció', () => {
    expect(linkStatus(link({ expiresAt: new Date('2026-09-19T11:00:00Z') }), NOW)).toBe('expired')
  })

  it('justo en el instante de vencer ya no sirve', () => {
    expect(linkStatus(link({ expiresAt: NOW }), NOW)).toBe('expired')
  })

  it('un milisegundo antes de vencer todavía sirve', () => {
    expect(linkStatus(link({ expiresAt: new Date(NOW.getTime() + 1) }), NOW)).toBe('usable')
  })
})

// La precedencia es lo que hace que la pantalla diga lo más útil y no lo primero que encuentre.
describe('cuando el enlace cae en más de un motivo a la vez', () => {
  it('reemplazado le gana a ya usado', () => {
    const both = link({
      supersededAt: new Date('2026-09-19T11:50:00Z'),
      consumedAt: new Date('2026-09-19T11:55:00Z'),
    })
    expect(linkStatus(both, NOW)).toBe('superseded')
  })

  it('reemplazado le gana a vencido', () => {
    const both = link({
      supersededAt: new Date('2026-09-19T11:50:00Z'),
      expiresAt: new Date('2026-09-19T11:00:00Z'),
    })
    expect(linkStatus(both, NOW)).toBe('superseded')
  })

  it('ya usado le gana a vencido', () => {
    const both = link({
      consumedAt: new Date('2026-09-19T11:50:00Z'),
      expiresAt: new Date('2026-09-19T11:00:00Z'),
    })
    expect(linkStatus(both, NOW)).toBe('consumed')
  })

  it('los tres juntos siguen diciendo reemplazado', () => {
    const all = link({
      supersededAt: new Date('2026-09-19T11:40:00Z'),
      consumedAt: new Date('2026-09-19T11:50:00Z'),
      expiresAt: new Date('2026-09-19T11:00:00Z'),
    })
    expect(linkStatus(all, NOW)).toBe('superseded')
  })
})
