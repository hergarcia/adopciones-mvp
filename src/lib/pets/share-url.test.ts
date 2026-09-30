// Covers: US2-AS2, FR-013 (se comparte la dirección del sitio, nunca la de la barra).
import { describe, expect, it } from 'vitest'
import { APP_URL } from '@/lib/config'
import { shareUrl } from './share-url'

describe('shareUrl', () => {
  it('es la dirección del sitio más el código, sin agregados', () => {
    expect(shareUrl('k3x9p2qa7m')).toBe(new URL('/animales/k3x9p2qa7m', APP_URL).toString())
    expect(shareUrl('k3x9p2qa7m')).toMatch(/^https?:\/\/[^?#]+\/animales\/k3x9p2qa7m$/)
  })
})
