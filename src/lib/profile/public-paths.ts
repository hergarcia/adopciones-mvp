import { safeDestination } from '@/lib/auth/next-destination'
import { APP_URL } from '@/lib/config'
import type { VerificationLevel } from '@/lib/verification/level'

// 22 caracteres de base64url: 128 bits al azar (research R1). Lo que no tiene esta forma no llega a
// la base y cae en el mismo «este perfil no existe».
const PUBLIC_ID = /^[A-Za-z0-9_-]{22}$/

export const LEVELS_PATH = '/niveles'

export function isPublicId(candidate: string): boolean {
  return PUBLIC_ID.test(candidate)
}

export function publicProfilePath(publicId: string): string {
  return `/perfil/${publicId}`
}

export function publicProfileUrl(publicId: string): string {
  return new URL(publicProfilePath(publicId), APP_URL).toString()
}

export function publicPhotoPath(publicId: string): string {
  return `${publicProfilePath(publicId)}/foto`
}

// Sin nivel no se destaca ninguno (FR-024). `desde` es la vuelta, así que pasa por la misma
// validación que cualquier destino: un enlace armado afuera no puede mandar a otro sitio.
export function levelsPath(level: VerificationLevel, from: string | null): string {
  const query = new URLSearchParams()
  if (level > 0) query.set('nivel', String(level))
  if (from !== null) query.set('desde', safeDestination(from))
  const search = query.toString()
  return search === '' ? LEVELS_PATH : `${LEVELS_PATH}?${search}`
}
