import { redirect } from 'next/navigation'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import type { Profile } from '@/lib/supabase/queries/profiles'
import { gateCheck, type GateReason } from '@/lib/verification/gate'
import { phoneStatus } from '@/lib/verification/phone-status'
import { requireProfile } from './require-profile'

type Request = { path: string; reason: GateReason; from?: string | null }

/**
 * La puerta de publicar y solicitar (FR-013). Es el piso, nivel 1: el nivel mínimo que exija un
 * publicador se suma encima, en la historia que lo construya (FR-013g).
 *
 * Para una página: sin sesión o sin perfil, lo que ya pide `requireProfile`; sin nivel 1, al aviso.
 */
export async function requireVerifiedPhone(request: Request): Promise<Profile> {
  const profile = await requireProfile(request.path)
  const check = gateCheck(phoneStatus(await getMyPhone(), new Date()), request)
  if (!check.pass) redirect(check.gatePath)
  return profile
}

/** Para una acción: no redirige, así la hoja cliente lleva al aviso sin perder lo escrito. */
export async function checkVerifiedPhone(
  request: Request,
): Promise<{ ok: true } | { ok: false; gatePath: string }> {
  const check = gateCheck(phoneStatus(await getMyPhone(), new Date()), request)
  return check.pass ? { ok: true } : { ok: false, gatePath: check.gatePath }
}
