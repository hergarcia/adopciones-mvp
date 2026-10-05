import { verifyPath } from '@/lib/verification/gate'
import type { NextStep } from './next-step'

export const MY_VOUCHES_PATH = '/mis-avales'
const COMPLETE_PROFILE_PATH = '/completar-perfil'
const IDENTITY_PATH = '/verificar-identidad'

/** La marca que deja avalar, retirar o quitar en la pantalla a la que se vuelve (research R16). */
export const VOUCH_FLAG = 'aval'
export const VOUCH_FLAGS = [
  'dado',
  'retirado',
  'quitado',
  'ausente',
  'cambio',
  'no-se-pudo',
] as const
export type VouchFlag = (typeof VOUCH_FLAGS)[number]

// Una distinta en cada acción: una segunda acción en la misma pantalla trae la misma marca, y sin
// esto el aviso ya cerrado no vuelve a salir ni la marca se va de la dirección.
export const VOUCH_NONCE = 'vez'

/** Lo que la pantalla lee de la dirección después de una acción. */
export type VouchQuery = { [VOUCH_FLAG]?: string; [VOUCH_NONCE]?: string }

export function withVouchFlag(path: string, flag: VouchFlag, nonce: number): string {
  return `${path}?${VOUCH_FLAG}=${flag}&${VOUCH_NONCE}=${nonce}`
}

export function parseVouchFlag(value: string | undefined): VouchFlag | null {
  return VOUCH_FLAGS.find((flag) => flag === value) ?? null
}

// A dónde lleva el paso que falta para avalar (FR-011.7). Completar el perfil y verificar el
// teléfono vuelven al perfil que se miraba; la identidad se revisa en días, así que no hay vuelta
// (spec §Assumptions). Un pedido en revisión no tiene nada que tocar.
export function stepHref(step: NextStep, returnPath: string): string | null {
  switch (step.kind) {
    case 'complete_profile':
      return `${COMPLETE_PROFILE_PATH}?next=${encodeURIComponent(returnPath)}`
    case 'verify_phone':
      return verifyPath({ reason: 'vouch', next: returnPath, from: returnPath })
    case 'verify_identity':
      return IDENTITY_PATH
    default:
      return null
  }
}
