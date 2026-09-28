// Covers: FR-008 y los Edge Cases «Foto chica» y «Foto muy apaisada o muy vertical».
import { describe, expect, it, vi } from 'vitest'
import { encodingPlan, targetSize } from './photo-sizing'

describe('targetSize', () => {
  it('una apaisada queda con el ancho al tope', () => {
    expect(targetSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 })
  })

  it('una vertical queda con el alto al tope', () => {
    expect(targetSize(3000, 4000, 800)).toEqual({ width: 600, height: 800 })
  })

  it('una cuadrada queda cuadrada', () => {
    expect(targetSize(2000, 2000, 400)).toEqual({ width: 400, height: 400 })
  })

  it('una más chica que el tope no se agranda', () => {
    expect(targetSize(640, 480, 1600)).toEqual({ width: 640, height: 480 })
    expect(targetSize(1600, 900, 1600)).toEqual({ width: 1600, height: 900 })
  })

  it('redondea al píxel', () => {
    expect(targetSize(1000, 333, 400)).toEqual({ width: 400, height: 133 })
    expect(targetSize(1000, 337, 400)).toEqual({ width: 400, height: 135 })
  })
})

describe('encodingPlan', () => {
  const MB = 1024 * 1024
  type BytesAt = (quality: number) => Promise<readonly number[]>

  it('se queda con la primera calidad que entra, sin probar las demás', async () => {
    const bytesAt = vi.fn<BytesAt>(async () => [0.1 * MB, 0.4 * MB, 1 * MB])
    expect(await encodingPlan(bytesAt)).toBe(0.82)
    expect(bytesAt).toHaveBeenCalledTimes(1)
    expect(bytesAt).toHaveBeenCalledWith(0.82)
  })

  it('baja la calidad cuando no entra', async () => {
    const sizes: Record<number, number[]> = {
      0.82: [0.2 * MB, 0.8 * MB, 1 * MB],
      0.72: [0.2 * MB, 0.6 * MB, 0.8 * MB],
      0.62: [0.1 * MB, 0.4 * MB, 0.7 * MB],
    }
    const bytesAt = vi.fn<BytesAt>(async (quality) => sizes[quality])
    expect(await encodingPlan(bytesAt)).toBe(0.62)
    expect(bytesAt.mock.calls).toEqual([[0.82], [0.72], [0.62]])
  })

  it('baja la calidad cuando un tamaño pasa de 1 MB aunque el total entre', async () => {
    const sizes: Record<number, number[]> = {
      0.82: [0.05 * MB, 0.3 * MB, 1 * MB + 1],
      0.72: [0.05 * MB, 0.3 * MB, 1 * MB],
    }
    expect(await encodingPlan(async (quality) => sizes[quality])).toBe(0.72)
  })

  it('rechaza cuando ni la última entra', async () => {
    expect(await encodingPlan(async () => [0.5 * MB, 0.5 * MB, 0.5 * MB + 1])).toBeNull()
    expect(await encodingPlan(async () => [0.1 * MB, 1 * MB + 1])).toBeNull()
  })
})
