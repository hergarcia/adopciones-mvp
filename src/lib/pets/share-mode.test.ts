// Covers: US2-AS2, US2-AS3, US2-AS8, FR-013 y los Edge Cases «Compartir sin poder copiar» y «Tocar
// "Compartir" varias veces seguidas» (research R8). Lo que hace la hoja `ShareButton` vive acá: la
// decisión, el orden de los intentos y el freno a un segundo toque.
import { describe, expect, it, vi } from 'vitest'
import { APP_URL } from '@/lib/config'
import { afterShareError, shareGate, shareLink, shareMode, shareUrl } from './share-mode'

const abort = () => Object.assign(new Error('cerró'), { name: 'AbortError' })
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

describe('afterShareError', () => {
  it('cerrar las opciones es cancelar, sin error', () => {
    expect(afterShareError(abort(), true)).toBe('cancelled')
  })

  it('otra falla copia, o muestra el enlace si no se puede copiar', () => {
    expect(afterShareError(new Error('NotAllowedError'), true)).toBe('copy')
    expect(afterShareError('raro', true)).toBe('copy')
    expect(afterShareError({ name: 'AbortError' }, true)).toBe('copy')
    expect(afterShareError(new Error('x'), false)).toBe('manual')
  })
})

describe('shareUrl', () => {
  it('es la dirección del sitio más el código, sin agregados', () => {
    expect(shareUrl('k3x9p2qa7m')).toBe(new URL('/animales/k3x9p2qa7m', APP_URL).toString())
    expect(shareUrl('k3x9p2qa7m')).toMatch(/^https?:\/\/[^?#]+\/animales\/k3x9p2qa7m$/)
  })
})

function deps(device: typeof PHONE) {
  return {
    device,
    url: 'https://sitio.test/animales/k3x9p2qa7m',
    title: 'Luna en adopción',
    share: vi.fn<(data: { title: string; url: string }) => Promise<void>>(async () => {}),
    copy: vi.fn<(text: string) => Promise<void>>(async () => {}),
  }
}

describe('shareLink', () => {
  it('en el teléfono abre las opciones con el título y el enlace', async () => {
    const d = deps(PHONE)
    expect(await shareLink(d)).toBe('shared')
    expect(d.share).toHaveBeenCalledWith({ title: 'Luna en adopción', url: d.url })
    expect(d.copy).not.toHaveBeenCalled()
  })

  it('cerrar las opciones sin elegir no copia ni avisa nada', async () => {
    const d = deps(PHONE)
    d.share.mockRejectedValueOnce(abort())
    expect(await shareLink(d)).toBe('cancelled')
    expect(d.copy).not.toHaveBeenCalled()
  })

  it('si las opciones fallan por otra cosa, copia', async () => {
    const d = deps(PHONE)
    d.share.mockRejectedValueOnce(new Error('falló'))
    expect(await shareLink(d)).toBe('copied')
    expect(d.copy).toHaveBeenCalledWith(d.url)
  })

  it('si fallan y no se puede copiar, el enlace a mano', async () => {
    const d = deps({ ...PHONE, canCopy: false })
    d.share.mockRejectedValueOnce(new Error('falló'))
    expect(await shareLink(d)).toBe('manual')
    expect(d.copy).not.toHaveBeenCalled()
  })

  it('en la computadora copia el enlace de la ficha', async () => {
    const d = deps(DESKTOP)
    expect(await shareLink(d)).toBe('copied')
    expect(d.copy).toHaveBeenCalledWith(d.url)
    expect(d.share).not.toHaveBeenCalled()
  })

  it('si copiar falla, el enlace a mano', async () => {
    const d = deps(DESKTOP)
    d.copy.mockRejectedValueOnce(new Error('sin permiso'))
    expect(await shareLink(d)).toBe('manual')
  })

  it('sin poder copiar, el enlace a mano sin intentar', async () => {
    const d = deps({ coarse: false, canShare: false, canCopy: false })
    expect(await shareLink(d)).toBe('manual')
    expect(d.copy).not.toHaveBeenCalled()
  })
})

describe('shareGate', () => {
  it('dos toques seguidos abren las opciones una sola vez', async () => {
    const run = vi.fn<() => Promise<'shared'>>(async () => 'shared')
    const gate = shareGate(run)
    const [first, second] = await Promise.all([gate.tap(), gate.tap()])
    expect([first, second]).toEqual(['shared', null])
    expect(run).toHaveBeenCalledTimes(1)
  })

  it.each(['shared', 'cancelled'] as const)(
    'después de «%s», se puede tocar de nuevo',
    async (outcome) => {
      const gate = shareGate(async () => outcome)
      await gate.tap()
      expect(await gate.tap()).toBe(outcome)
    },
  )

  it.each(['copied', 'manual'] as const)(
    'mientras se ve el aviso de «%s», no apila otro; al cerrarse, sí',
    async (outcome) => {
      const run = vi.fn<() => Promise<typeof outcome>>(async () => outcome)
      const gate = shareGate(run)
      await gate.tap()
      expect(await gate.tap()).toBeNull()
      gate.release()
      expect(await gate.tap()).toBe(outcome)
      expect(run).toHaveBeenCalledTimes(2)
    },
  )
})
