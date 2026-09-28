// Covers: FR-015, FR-016, US3-AS7
import { describe, expect, it } from 'vitest'
import { formatCursor, parseCursor } from './listing-cursor'

describe('el cursor', () => {
  const cursor = { publishedAt: '2026-09-28T14:06:44.200492+00:00', code: 'k3x9p2qa7m' }

  it('ida y vuelta, sin perder los microsegundos', () => {
    expect(formatCursor(cursor)).toBe('2026-09-28T14:06:44.200492+00:00~k3x9p2qa7m')
    expect(parseCursor(formatCursor(cursor))).toEqual(cursor)
    expect(parseCursor('2026-09-28T14:06:44Z~k3x9p2qa7m')).toEqual({
      publishedAt: '2026-09-28T14:06:44Z',
      code: 'k3x9p2qa7m',
    })
  })

  it.each([
    [null],
    [undefined],
    [''],
    ['2026-09-28T14:06:44Z'],
    ['2026-09-28T14:06:44Z~k3x9p2qa7m~otro'],
    ['2026-09-28T14:06:44Z~K3X9P2QA7M'],
    ['2026-09-28~k3x9p2qa7m'],
    ['x2026-09-28T14:06:44Z~k3x9p2qa7m'],
    ['+002026-09-28T14:06:44Z~k3x9p2qa7m'],
    ['2026-09-28T14:06:44Zx~k3x9p2qa7m'],
    ['2026-09-28T14:06:44.1234567Z~k3x9p2qa7m'],
    ['2026-09-28T14:06:44+0000~k3x9p2qa7m'],
  ])('%j mal formado es null', (raw) => {
    expect(parseCursor(raw)).toBeNull()
  })
})
