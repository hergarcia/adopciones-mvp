import { MAX_PHOTO_FILE_BYTES, MAX_PREPARED_PHOTO_BYTES, PHOTO_QUALITIES } from './rules'

// El lado largo al tope y la proporción intacta. Por el lado largo y no por el ancho: una
// apaisada de 1600 de ancho quedaría enana en la card vertical. Una foto chica no se agranda.
export function targetSize(width: number, height: number, longSide: number) {
  const scale = Math.min(1, longSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

// La primera calidad cuyos tres tamaños juntos entran en 1,5 MB y ninguno pasa de 1 MB, o null si
// ni la última entra: entonces la foto se rechaza con «no pudimos preparar esta foto» (research R2).
// El tope por archivo es el mismo que aplica el servidor: una foto que lo pasa se vería lista acá y
// fallaría en cada intento de subirla.
export async function encodingPlan(
  bytesAt: (quality: number) => Promise<readonly number[]>,
): Promise<number | null> {
  for (const quality of PHOTO_QUALITIES) {
    // Una por vez y en orden: la primera que entra evita exportar las demás.
    // oxlint-disable-next-line no-await-in-loop
    const sizes = await bytesAt(quality)
    const total = sizes.reduce((sum, size) => sum + size, 0)
    if (total <= MAX_PREPARED_PHOTO_BYTES && sizes.every((size) => size <= MAX_PHOTO_FILE_BYTES))
      return quality
  }
  return null
}
