import { MAX_PREPARED_PHOTO_BYTES, PHOTO_QUALITIES } from './rules'

// El lado largo al tope y la proporción intacta. Por el lado largo y no por el ancho: una
// apaisada de 1600 de ancho quedaría enana en la card vertical. Una foto chica no se agranda.
export function targetSize(width: number, height: number, longSide: number) {
  const scale = Math.min(1, longSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

// La primera calidad cuyos tres tamaños juntos entran en 1,5 MB, o null si ni la última entra:
// entonces la foto se rechaza con «no pudimos preparar esta foto» (research R2).
export async function encodingPlan(
  bytesAt: (quality: number) => Promise<number>,
): Promise<number | null> {
  for (const quality of PHOTO_QUALITIES) {
    // Una por vez y en orden: la primera que entra evita exportar las demás.
    // oxlint-disable-next-line no-await-in-loop
    if ((await bytesAt(quality)) <= MAX_PREPARED_PHOTO_BYTES) return quality
  }
  return null
}
