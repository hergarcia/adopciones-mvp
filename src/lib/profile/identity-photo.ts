import {
  IDENTITY_PHOTO_FALLBACK_SIDE,
  IDENTITY_PHOTO_MAX_BYTES,
  IDENTITY_PHOTO_MAX_SIDE,
  IDENTITY_PHOTO_TARGET_BYTES,
} from '@/lib/verification/rules'
import { ACCEPTED_TYPES } from './avatar'

const RIFF = [0x52, 0x49, 0x46, 0x46]
const WEBP = [0x57, 0x45, 0x42, 0x50]
const JPEG = [0xff, 0xd8, 0xff]

// Los formatos que deja el procesado del navegador, en orden de preferencia: WebP donde el canvas
// lo sabe exportar, JPEG donde no (Safari y todo iOS devuelven PNG si se les pide WebP). Los dos
// salen del canvas, así que ninguno trae metadatos.
export const PROCESSED_PHOTO_TYPES = ['image/webp', 'image/jpeg'] as const
export type ProcessedPhotoType = (typeof PROCESSED_PHOTO_TYPES)[number]

// El formato según los bytes: `RIFF`, cuatro de tamaño y `WEBP`, o `FF D8 FF`. El tipo lo declara
// el navegador y se puede mentir; los bytes no.
export function processedPhotoType(bytes: Uint8Array): ProcessedPhotoType | null {
  if (
    RIFF.every((byte, i) => bytes[i] === byte) &&
    WEBP.every((byte, i) => bytes[8 + i] === byte)
  ) {
    return 'image/webp'
  }
  if (JPEG.every((byte, i) => bytes[i] === byte)) return 'image/jpeg'
  return null
}

export type IdentityPhotoRejection = 'identity.errors.photo_type' | 'identity.errors.photo_too_big'

// Los mismos formatos que la foto de perfil (FR-006), con el tope de 10 MB antes de procesar.
export function identityPhotoRejection(file: {
  type: string
  size: number
}): IdentityPhotoRejection | null {
  if (!ACCEPTED_TYPES.some((accepted) => accepted === file.type)) {
    return 'identity.errors.photo_type'
  }
  if (file.size > IDENTITY_PHOTO_MAX_BYTES) return 'identity.errors.photo_too_big'
  return null
}

// La escalera del procesado: la primera vuelta a 1600 px, y mientras el WebP pase de 450 KB, menos
// calidad y después menos lado. Dos fotos tienen que entrar en el límite de 1 MB de una acción
// (plan §3); si ni el último escalón entra, la foto no se puede usar.
const LADDER = [
  { side: IDENTITY_PHOTO_MAX_SIDE, quality: 0.85 },
  { side: IDENTITY_PHOTO_MAX_SIDE, quality: 0.75 },
  { side: IDENTITY_PHOTO_MAX_SIDE, quality: 0.65 },
  { side: IDENTITY_PHOTO_FALLBACK_SIDE, quality: 0.65 },
] as const

export type EncodeDecision =
  | { kind: 'encode'; step: number; width: number; height: number; quality: number }
  | { kind: 'done' }
  | { kind: 'give_up' }

/**
 * Qué hacer después de exportar: `lastBytes` es lo que pesó la última salida (nulo antes de la
 * primera) y `lastStep` su escalón (-1 antes de la primera). Nunca agranda una foto chica.
 */
export function nextEncodeStep(
  width: number,
  height: number,
  lastBytes: number | null,
  lastStep: number,
): EncodeDecision {
  if (lastBytes !== null && lastBytes <= IDENTITY_PHOTO_TARGET_BYTES) return { kind: 'done' }

  const step = lastStep + 1
  const rung = LADDER[step]
  if (rung === undefined) return { kind: 'give_up' }

  const scale = Math.min(1, rung.side / Math.max(width, height))
  return {
    kind: 'encode',
    step,
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    quality: rung.quality,
  }
}
