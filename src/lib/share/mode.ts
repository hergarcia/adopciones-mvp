// Aparte de `share-mode.ts`: «Copiar enlace» elige su texto con esto al abrir, y el resto de cómo se
// comparte llega después (historias #304 y #318).

export type ShareMode = 'share' | 'copy' | 'manual'

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
