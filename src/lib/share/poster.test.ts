// Covers: historia #275, criterios 1 y 5: en el teléfono se manda con el enlace al lado, en la
// computadora se descarga; si no se pudo armar no se cuenta nada, y cada cartel mandado o descargado
// cuenta.
import { describe, expect, it, vi } from 'vitest'
import { countsAsShare, savePoster, type PosterOutcome, type PosterShare } from './poster'

const FILE = new File(['jpeg'], 'cartel-k3x9p2qa7m.jpg', { type: 'image/jpeg' })
const LINK = 'https://sitio.test/animales/k3x9p2qa7m?desde=cartel'

type Load = () => Promise<File | null>
type Share = (data: PosterShare) => Promise<void>

function setup(over: Partial<Parameters<typeof savePoster>[0]> = {}) {
  const poster = {
    coarse: true,
    load: vi.fn<Load>(async () => FILE),
    canShare: vi.fn<(data: PosterShare) => boolean>(() => true),
    share: vi.fn<Share>(async () => {}),
    download: vi.fn<(file: File) => void>(),
    title: 'Luna en adopción',
    link: LINK,
    ...over,
  }
  return poster
}

function named(name: string): Error {
  const error = new Error(name)
  error.name = name
  return error
}

describe('savePoster', () => {
  it('en el teléfono manda la imagen con el título y el enlace de la ficha al lado', async () => {
    const poster = setup()
    expect(await savePoster(poster)).toBe('shared')
    const data = { files: [FILE], title: 'Luna en adopción', text: LINK }
    expect(poster.canShare).toHaveBeenCalledWith(data)
    expect(poster.share).toHaveBeenCalledWith(data)
    expect(poster.download).not.toHaveBeenCalled()
  })

  it('en la computadora la descarga, aunque el navegador tenga opciones de compartir', async () => {
    const poster = setup({ coarse: false })
    expect(await savePoster(poster)).toBe('downloaded')
    expect(poster.download).toHaveBeenCalledWith(FILE)
    expect(poster.share).not.toHaveBeenCalled()
  })

  it('si el teléfono no deja mandar una imagen, la descarga', async () => {
    const poster = setup({ canShare: vi.fn<(data: PosterShare) => boolean>(() => false) })
    expect(await savePoster(poster)).toBe('downloaded')
    expect(poster.download).toHaveBeenCalledWith(FILE)
    expect(poster.share).not.toHaveBeenCalled()
  })

  it('si mandarla falla, la descarga', async () => {
    const poster = setup({
      share: vi.fn<Share>(async () => Promise.reject(named('NotAllowedError'))),
    })
    expect(await savePoster(poster)).toBe('downloaded')
    expect(poster.download).toHaveBeenCalledWith(FILE)
  })

  it('cerrar las opciones sin elegir no descarga nada', async () => {
    const poster = setup({ share: vi.fn<Share>(async () => Promise.reject(named('AbortError'))) })
    expect(await savePoster(poster)).toBe('cancelled')
    expect(poster.download).not.toHaveBeenCalled()
  })

  it('una falla que no es un Error tampoco se toma como cerrar las opciones', async () => {
    const poster = setup({
      share: vi.fn<Share>(async () => Promise.reject({ name: 'AbortError' })),
    })
    expect(await savePoster(poster)).toBe('downloaded')
  })

  it.each([
    ['el sitio no la pudo armar', vi.fn<Load>(async () => null)],
    [
      'se cortó la conexión',
      vi.fn<Load>(async () => Promise.reject(new TypeError('Failed to fetch'))),
    ],
  ])('si %s, no manda ni descarga nada', async (_, load) => {
    const poster = setup({ load })
    expect(await savePoster(poster)).toBe('failed')
    expect(poster.share).not.toHaveBeenCalled()
    expect(poster.download).not.toHaveBeenCalled()
  })
})

describe('countsAsShare', () => {
  it.each([
    ['shared', true],
    ['downloaded', true],
    ['cancelled', false],
    ['failed', false],
  ] satisfies [PosterOutcome, boolean][])('%s cuenta: %s', (outcome, counts) => {
    expect(countsAsShare(outcome)).toBe(counts)
  })
})
