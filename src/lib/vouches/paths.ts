import { verifyPath } from '@/lib/verification/gate'
import type { NextStep } from './next-step'

export const MY_VOUCHES_PATH = '/mis-avales'
const COMPLETE_PROFILE_PATH = '/completar-perfil'
const IDENTITY_PATH = '/verificar-identidad'

/** La marca que deja avalar, retirar o quitar en la pantalla a la que se vuelve (research R16). */
export const VOUCH_FLAG = 'aval'
export const VOUCH_FLAGS = ['dado', 'retirado', 'quitado', 'ausente', 'cambio'] as const
export type VouchFlag = (typeof VOUCH_FLAGS)[number]

export function withVouchFlag(path: string, flag: VouchFlag): string {
  return `${path}?${VOUCH_FLAG}=${flag}`
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
