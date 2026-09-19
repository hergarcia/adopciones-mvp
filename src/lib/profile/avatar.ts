export const AVATAR_SIZE = 256
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const

// HEIC no está en la lista aunque sea lo que sale de un iPhone: el navegador no lo sabe abrir
// fuera de Safari, y el propio teléfono lo convierte a JPEG al subirlo desde el navegador
// (KL-007). Prometerlo dejaría toda foto de iPhone fallando en Android y en la computadora.
export type AvatarRejection = 'profile.errors.photo_type' | 'profile.errors.photo_too_big'

export function rejectionFor(file: { type: string; size: number }): AvatarRejection | null {
  if (!ACCEPTED_TYPES.some((accepted) => accepted === file.type)) {
    return 'profile.errors.photo_type'
  }
  if (file.size > MAX_UPLOAD_BYTES) return 'profile.errors.photo_too_big'
  return null
}

// Recorta al cuadrado por el centro. Devuelve de dónde recortar en la imagen original: la parte
// aburrida del cálculo, y la única con bordes, así que vive sola y tiene test.
export function squareCrop(width: number, height: number) {
  const side = Math.min(width, height)
  return {
    x: Math.round((width - side) / 2),
    y: Math.round((height - side) / 2),
    side,
  }
}
