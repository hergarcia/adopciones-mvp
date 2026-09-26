'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { getLocale } from 'next-intl/server'
import { track } from '@/lib/analytics/track'
import { sendNumberLost } from '@/lib/email/send-number-lost'
import { phoneNumberSchema } from '@/lib/schemas/phone'
import { purgePhoneRecords } from '@/lib/supabase/queries/phone-codes'
import { claimPhoneNumber, dropClaim, getMyClaim } from '@/lib/supabase/queries/phone-claims'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { endSession, getSessionUser } from '@/lib/supabase/queries/session'
import {
  CLAIM_EXPIRED,
  claimOutcome,
  claimReadback,
  type ClaimReadback,
  type ClaimResult,
} from '@/lib/verification/claim-outcome'
import {
  claimPath,
  inUsePath,
  parseGate,
  signInPath,
  verifiedDestination,
} from '@/lib/verification/gate'
import type { ActionResult } from './result'

// Quedarse con un número verificado en otra cuenta (historia #25). El id de la cuenta sale de la
// sesión, nunca del navegador.

const SESSION_ERROR = 'verification.errors.session'

type GateParams = { para?: string; next?: string; desde?: string }

// «Es mío y no puedo entrar a esa cuenta». Se mide el toque se abra la confirmación o no (FR-014),
// y la prueba se comprueba antes de navegar: si ya no vale, la pantalla muestra el pedido de un
// código nuevo con el número que tiene a la vista, que así no se pierde en el camino (FR-008).
export async function startPhoneClaim(
  gateParams: GateParams,
): Promise<ActionResult<{ path: string }>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION_ERROR }

  // La lectura ya descarta lo vencido: la purga no tiene que ir antes.
  const [, , claim] = await Promise.all([
    purgePhoneRecords(),
    track('phone_claim_chosen'),
    getMyClaim(),
  ])
  if (claim === null) return { ok: false, error: CLAIM_EXPIRED }
  return { ok: true, data: { path: claimPath(parseGate(gateParams)) } }
}

// El número es el que la pantalla le mostró a la persona: si otra pestaña cambió la prueba por la de
// otro número, confirmar no se queda con uno que no leyó (FR-006).
export async function confirmPhoneClaim(
  input: string,
  gateParams: GateParams,
): Promise<ClaimResult> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION_ERROR }

  const parsed = phoneNumberSchema.safeParse({ number: input })
  if (!parsed.success) return { ok: false, error: CLAIM_EXPIRED }

  await purgePhoneRecords()
  const { result, events, lostAccount } = claimOutcome({
    facts: await claimPhoneNumber(user.id, parsed.data.number),
    destination: verifiedDestination(parseGate(gateParams)),
  })
  await Promise.all(events.map(track))
  if (result.ok) revalidatePath('/mi-perfil')

  // Después de responder: lo que ve esta cuenta, y cuándo, no puede depender del correo, o la
  // demora le diría si la otra cuenta todavía tenía el número (FR-009, FR-010). El id de la otra
  // cuenta vive solo en esta memoria.
  if (lostAccount !== null) {
    const locale = await getLocale()
    after(() => sendNumberLost({ ...lostAccount, locale }))
  }
  return result
}

// Después de una falla al confirmar, el estado real: el número lo trae la pantalla y la respuesta
// es sobre la propia cuenta, así que no revela nada que la cuenta no sepa (FR-011).
export async function readPhoneClaim(
  input: string,
  gateParams: GateParams,
): Promise<ActionResult<ClaimReadback>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION_ERROR }

  const parsed = phoneNumberSchema.safeParse({ number: input })
  if (!parsed.success) return { ok: true, data: { state: 'gone' } }

  const [phone, claim] = await Promise.all([
    getMyPhone().catch(() => undefined),
    getMyClaim(),
    purgePhoneRecords(),
  ])
  if (phone === undefined) return { ok: false, error: 'verification.claim.errors.unknown' }
  return {
    ok: true,
    data: claimReadback({
      number: parsed.data.number,
      verifiedNumber: phone?.verifiedNumber ?? null,
      claim,
      destination: verifiedDestination(parseGate(gateParams)),
    }),
  }
}

function formText(form: FormData, key: string): string | undefined {
  const value = form.get(key)
  return typeof value === 'string' ? value : undefined
}

// «Entrar con esa cuenta», desde un `<form action>`: cierra esta sesión y deja atrás la prueba, que
// es elegir no quedarse con el número (FR-003). La prueba se borra recién con la sesión cerrada: si
// cerrar falla, la persona sigue en la pantalla con la prueba como estaba. Si borrarla falla dos
// veces, se sigue igual: vence sola en menos de 10 minutos y solo la puede usar esta misma cuenta.
export async function signInWithOtherAccount(form: FormData): Promise<never> {
  const gate = parseGate({
    para: formText(form, 'para'),
    next: formText(form, 'next'),
    desde: formText(form, 'desde'),
  })
  const user = await getSessionUser()
  if (user === null) redirect(signInPath(gate))

  const { ok } = await endSession({ scope: 'local' })
  if (!ok) redirect(inUsePath(gate, { error: 'salir' }))

  if (!(await dropClaim(user.id)).ok) await dropClaim(user.id)
  await track('signed_out')
  redirect(signInPath(gate))
}
