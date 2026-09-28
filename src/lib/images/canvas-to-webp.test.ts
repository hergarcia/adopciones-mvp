import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canvasToWebp, type WebpSource } from './canvas-to-webp'

const encode = vi.hoisted(() =>
  vi.fn<(data: ImageData, options: { quality: number }) => Promise<ArrayBuffer>>(),
)
vi.mock('@jsquash/webp/encode', () => ({ default: encode }))

const PIXELS = {
  width: 3,
  height: 2,
  colorSpace: 'srgb',
  data: new Uint8ClampedArray(24),
} satisfies ImageData

function canvas(exported: Blob | null, hasContext = true) {
  const getImageData = vi.fn<CanvasRenderingContext2D['getImageData']>(() => PIXELS)
  const toBlob = vi.fn<HTMLCanvasElement['toBlob']>((done) => done(exported))
  const getContext = vi.fn<WebpSource['getContext']>(() => (hasContext ? { getImageData } : null))
  const element: WebpSource = {
    width: 3,
    height: 2,
    toBlob,
    getContext,
  }
  return { toBlob, element, getContext, getImageData }
}

beforeEach(() => {
  encode.mockReset()
  encode.mockResolvedValue(new Uint8Array([82, 73, 70, 70]).buffer)
})

describe('canvasToWebp', () => {
  it('usa el WebP del navegador cuando sabe hacerlo, con la calidad pedida', async () => {
    const webp = new Blob(['w'], { type: 'image/webp' })
    const { toBlob, element } = canvas(webp)

    expect(await canvasToWebp(element, 0.82)).toBe(webp)
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.82)
    expect(encode).not.toHaveBeenCalled()
  })

  it('si el navegador devuelve un PNG, como Safari, codifica WebP con los mismos píxeles', async () => {
    const { element, getContext, getImageData } = canvas(new Blob(['p'], { type: 'image/png' }))

    const blob = await canvasToWebp(element, 0.72)

    expect(getContext).toHaveBeenCalledWith('2d')
    expect(getImageData).toHaveBeenCalledWith(0, 0, 3, 2)
    expect(encode).toHaveBeenCalledWith(PIXELS, { quality: 72 })
    expect(blob.type).toBe('image/webp')
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([82, 73, 70, 70]))
  })

  it('si el navegador no devuelve nada, también codifica', async () => {
    const { element } = canvas(null)

    expect((await canvasToWebp(element, 0.62)).type).toBe('image/webp')
    expect(encode).toHaveBeenCalledWith(PIXELS, { quality: 62 })
  })

  it('sin contexto 2d falla en vez de mandar una foto vacía', async () => {
    const { element } = canvas(null, false)

    await expect(canvasToWebp(element, 0.82)).rejects.toThrow('sin contexto 2d')
    expect(encode).not.toHaveBeenCalled()
  })
})
