import type { ShareDevice } from './share-mode'

// Solo en el navegador: en el servidor no hay equipo que mirar.
export function readShareDevice(): ShareDevice {
  return {
    coarse: window.matchMedia('(pointer: coarse)').matches,
    canShare: typeof navigator.share === 'function',
    canCopy: typeof navigator.clipboard?.writeText === 'function',
  }
}
