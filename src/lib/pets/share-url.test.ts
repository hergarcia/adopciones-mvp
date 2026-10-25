// Covers: US2-AS2 y FR-013 de la #57 (se comparte la dirección del sitio, nunca la de la barra);
// US3-AS6, FR-024 de la #169 (la marca de Compartir no identifica a nadie); FR-035 de la #205.
import { describe, expect, it } from 'vitest'
import { APP_URL } from '@/lib/config'
import { litterPath } from '@/lib/litters/paths'
import { petPath } from './paths'
import { shareUrl } from './share-url'

describe('shareUrl', () => {
  it('es la dirección del sitio más la ficha y la marca de Compartir', () => {
    expect(shareUrl(petPath('k3x9p2qa7m'))).toBe(
      `${new URL('/animales/k3x9p2qa7m', APP_URL).toString()}?desde=compartir`,
    )
    expect(shareUrl(petPath('k3x9p2qa7m'))).toMatch(
      /^https?:\/\/[^?#]+\/animales\/k3x9p2qa7m\?desde=compartir$/,
    )
  })

  it('la de una camada lleva a su ficha, con la misma marca', () => {
    expect(shareUrl(litterPath('k3x9p2qa7m'))).toBe(
      `${new URL('/camadas/k3x9p2qa7m', APP_URL).toString()}?desde=compartir`,
    )
  })

  it('la marca es la misma para cualquier ficha: no dice quién compartió ni cuándo', () => {
    for (const code of ['ABC', 'zz99yy88xx']) {
      expect(new URL(shareUrl(petPath(code))).search).toBe('?desde=compartir')
    }
  })
})
