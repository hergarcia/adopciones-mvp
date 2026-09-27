import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES, photoFileProblem } from '@/lib/images/photo-file'

export const AVATAR_SIZE = 256
export const MAX_UPLOAD_BYTES = MAX_PHOTO_BYTES
export const ACCEPTED_TYPES = ACCEPTED_PHOTO_TYPES

export type AvatarRejection = 'profile.errors.photo_type' | 'profile.errors.photo_too_big'

export function rejectionFor(file: { type: string; size: number }): AvatarRejection | null {
  const problem = photoFileProblem(file)
  if (problem === null) return null
  return problem === 'type' ? 'profile.errors.photo_type' : 'profile.errors.photo_too_big'
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
