'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { track } from '@/lib/analytics/track'
import { APP_NAME } from '@/lib/config'
import { phoneCodeSchema, phoneNumberSchema } from '@/lib/schemas/phone'
import { sendSms } from '@/lib/sms/send-sms'
import {
  cancelPendingNumber,
  checkPhoneCode,
  nextPhoneCodeAt,
  purgePhoneRecords,
  reservePhoneCode,
  settlePhoneCode,
} from '@/lib/supabase/queries/phone-codes'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { codeCheckOutcome, type ConfirmResult } from '@/lib/verification/code-check'
import { codeDigest, generateCode, numberGroup } from '@/lib/verification/code'
import { cancelReturnPath, parseGate, verifiedDestination } from '@/lib/verification/gate'
import { formatPhoneNumber } from '@/lib/verification/phone-number'
import { hasPending, phoneStatus } from '@/lib/verification/phone-status'
import {
  requestOutcome,
  type Delivery,
  type RequestResult,
} from '@/lib/verification/request-outcome'
import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'

const SESSION_ERROR = 'verification.errors.session'

// El id de la cuenta sale de la sesión, nunca del navegador.

export async function requestPhoneCode(input: string): Promise<RequestResult> {
  const parsed = phoneNumberSchema.safeParse({ number: input })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'verification.errors.number_format',
    }
  }

  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION_ERROR }
  return issueCode(user.id, parsed.data.number)
}

// Pedir otro desde la pantalla del código: el número lo resuelve el servidor, así un formulario
// enviado vacío no reenvía nada por error.
export async function resendPhoneCode(): Promise<RequestResult> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION_ERROR }

  // La lectura lanza si la base no responde; una acción devuelve el error, no lo tira.
  const phone = await getMyPhone().catch(() => undefined)
  if (phone === undefined) return { ok: false, error: 'verification.errors.send_failed' }
  const status = phoneStatus(phone, new Date())
  if (!hasPending(status)) return { ok: false, error: 'verification.errors.no_pending' }
  return issueCode(user.id, status.number)
}

async function issueCode(userId: string, number: string): Promise<RequestResult> {
  await purgePhoneRecords()

  const code = generateCode()
  const reserved = await reservePhoneCode({
    userId,
    number,
    numberGroup: numberGroup(number),
    codeDigest: codeDigest(userId, code),
  })
  if (reserved === null) return { ok: false, error: 'verification.errors.send_failed' }

  let delivery: Delivery | null = null
  if (reserved.decision === 'send' && reserved.codeId !== null) {
    const t = await getTranslations('verification.sms')
    const sent = await sendSms(number, t('body', { app: APP_NAME, code }))
    const settled = await settlePhoneCode(reserved.codeId, sent)
    delivery = !settled.ok && sent === 'sent' ? 'settle_failed' : sent
  }

  const { result, events } = requestOutcome({
    reserved,
    delivery,
    number: formatPhoneNumber(number),
    nextAt: await nextPhoneCodeAt(userId),
    now: new Date(),
    format: { timeZone: URUGUAY_TIME_ZONE, locale: await getLocale() },
  })
  await Promise.all(events.map((event) => track(event)))
  if (result.ok) revalidatePath('/mi-perfil')
  return result
}

export async function confirmPhoneCode(
  input: string,
  gateParams: { para?: string; next?: string; desde?: string },
): Promise<ConfirmResult> {
  const parsed = phoneCodeSchema.safeParse({ code: input })
  if (!parsed.success) {
    return { ok: false, error: 'verification.errors.code_format', detail: { clearInput: false } }
  }

  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION_ERROR, detail: { clearInput: false } }

  const gate = parseGate(gateParams)
  const { result, events } = codeCheckOutcome({
    facts: await checkPhoneCode(user.id, codeDigest(user.id, parsed.data.code)),
    destination: verifiedDestination(gate),
  })
  await Promise.all(events.map((event) => track(event)))

  // Con "número en uso" no se revalida: sin número a medias, la pantalla del código redirigiría y
  // se llevaría el mensaje (FR-008c).
  if (result.ok) revalidatePath('/mi-perfil')
  return result
}

// Desde un `<form action>`, así funciona sin JavaScript. Vuelve a la pantalla desde la que se
// canceló, con la marca de lo que pasó (FR-015a).
export async function cancelPendingPhone(form: FormData): Promise<never> {
  const from = form.get('from')
  const user = await getSessionUser()
  const cancelled = user !== null && (await cancelPendingNumber(user.id)).ok
  if (cancelled) revalidatePath('/mi-perfil')
  redirect(cancelReturnPath(typeof from === 'string' ? from : null, cancelled))
}
