export type ShareMode = 'share' | 'copy' | 'manual'
export type ShareOutcome = 'shared' | 'cancelled' | 'copied' | 'manual'

export type ShareDevice = {
  /** La forma principal de usar el equipo es el dedo (`pointer: coarse`). */
  coarse: boolean
  canShare: boolean
  canCopy: boolean
}

// Manda la forma principal de usar el equipo, no lo que tiene el navegador: Chrome en Windows y
// Safari en macOS tienen opciones de compartir, y en la computadora se espera copiar (FR-013, R8).
export function shareMode({ coarse, canShare, canCopy }: ShareDevice): ShareMode {
  if (coarse && canShare) return 'share'
  return canCopy ? 'copy' : 'manual'
}

// Cerrar las opciones sin elegir nada no es un error (FR-013); otra falla copia, como una
// computadora, o muestra el enlace si tampoco se puede copiar.
export function afterShareError(error: unknown, canCopy: boolean): 'cancelled' | ShareMode {
  if (error instanceof Error && error.name === 'AbortError') return 'cancelled'
  return canCopy ? 'copy' : 'manual'
}

type Share = {
  device: ShareDevice
  url: string
  title?: string
  share: (data: { title?: string; url: string }) => Promise<void>
  copy: (text: string) => Promise<void>
}

export async function shareLink({ device, url, title, share, copy }: Share): Promise<ShareOutcome> {
  let mode = shareMode(device)
  if (mode === 'share') {
    try {
      await share({ title, url })
      return 'shared'
    } catch (error) {
      const next = afterShareError(error, device.canCopy)
      if (next === 'cancelled') return 'cancelled'
      mode = next
    }
  }
  if (mode === 'manual') return 'manual'
  try {
    await copy(url)
    return 'copied'
  } catch {
    return 'manual'
  }
}

// Un toque mientras las opciones están abiertas, o mientras se ve «Enlace copiado» o el enlace para
// copiar a mano, no hace nada (FR-013): lo abierto se suelta al cerrarse, con `release`.
export function shareGate(run: () => Promise<ShareOutcome>) {
  let busy = false
  return {
    async tap(): Promise<ShareOutcome | null> {
      if (busy) return null
      busy = true
      const outcome = await run()
      busy = outcome === 'copied' || outcome === 'manual'
      return outcome
    },
    release() {
      busy = false
    },
  }
}
