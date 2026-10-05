// Covers: FR-031 (si falla el correo de suspensión o de reactivación, la decisión vale igual)
import { afterEach, describe, expect, it, vi } from 'vitest'
import { deliverNotice } from './deliver-notice'

afterEach(() => {
  vi.useRealTimers()
})

describe('deliverNotice', () => {
  it('dice que salió cuando el servicio lo aceptó', async () => {
    await expect(deliverNotice(() => Promise.resolve({ ok: true }))).resolves.toEqual({
      sent: true,
    })
  })

  it('no lanza si el servicio no lo aceptó', async () => {
    await expect(deliverNotice(() => Promise.resolve({ ok: false }))).resolves.toEqual({
      sent: false,
    })
  })

  it('no lanza si el envío lanza, tampoco antes de devolver la promesa', async () => {
    await expect(deliverNotice(() => Promise.reject(new Error('caído')))).resolves.toEqual({
      sent: false,
    })
    await expect(
      deliverNotice(() => {
        throw new Error('sin red')
      }),
    ).resolves.toEqual({ sent: false })
  })

  it('pasado el plazo cuenta como no enviado, aunque el servicio no conteste nunca', async () => {
    vi.useFakeTimers()
    const delivering = deliverNotice(() => new Promise(() => {}))
    await vi.advanceTimersByTimeAsync(60_000)
    await expect(delivering).resolves.toEqual({ sent: false })
  })
})
