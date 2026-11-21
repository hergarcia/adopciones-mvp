// Covers: US2-AS2, US2-AS3, FR-013 (research R8): con qué se comparte según el equipo.
import { describe, expect, it } from 'vitest'
import { shareMode } from './mode'

const PHONE = { coarse: true, canShare: true, canCopy: true }
const DESKTOP = { coarse: false, canShare: true, canCopy: true }

describe('shareMode', () => {
  it('con el dedo y opciones de compartir, las abre', () => {
    expect(shareMode(PHONE)).toBe('share')
  })

  it('con puntero copia, aunque el navegador tenga opciones de compartir', () => {
    expect(shareMode(DESKTOP)).toBe('copy')
  })

  it('con el dedo y sin opciones de compartir, copia', () => {
    expect(shareMode({ ...PHONE, canShare: false })).toBe('copy')
  })

  it('sin poder copiar, el enlace a mano', () => {
    expect(shareMode({ coarse: false, canShare: false, canCopy: false })).toBe('manual')
    expect(shareMode({ ...PHONE, canShare: false, canCopy: false })).toBe('manual')
  })
})
