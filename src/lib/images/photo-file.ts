// La regla del archivo que se elige, la misma para la foto de perfil y las de un animal: los
// cuatro formatos y hasta 10 MB (historia #9, FR-025).
//
// HEIC no está en la lista aunque sea lo que sale de un iPhone: el navegador no lo sabe abrir
// fuera de Safari, y el propio teléfono lo convierte a JPEG al subirlo desde el navegador
// (KL-007). Prometerlo dejaría toda foto de iPhone fallando en Android y en la computadora.
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024

export type PhotoFileProblem = 'type' | 'too_big'

// El tipo se mira antes que el tamaño: decir «pesa mucho» de un PDF confunde.
export function photoFileProblem(file: { type: string; size: number }): PhotoFileProblem | null {
  if (!ACCEPTED_PHOTO_TYPES.some((accepted) => accepted === file.type)) return 'type'
  if (file.size > MAX_PHOTO_BYTES) return 'too_big'
  return null
}
