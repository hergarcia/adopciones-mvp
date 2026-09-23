import { getFormatter, getLocale, getTranslations } from 'next-intl/server'
import type { PhoneCodeFormTexts } from '@/components/verification/phone-code-form'
import type { PhoneNumberFormTexts } from '@/components/verification/phone-number-form'
import type { PhoneStatusCardTexts } from '@/components/verification/phone-status-card'
import type { VerifyPhoneScreenTexts } from '@/components/verification/verify-phone-screen'
import type { GateReason } from '@/lib/verification/gate'
import type { PhoneStatus } from '@/lib/verification/phone-status'
import { nextPhoneCodeAt } from '@/lib/supabase/queries/phone-codes'
import { retryDisplay, type RetryDisplay, type RetryTexts } from '@/lib/verification/retry-at'
import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'

// Los textos de las hojas cliente de la verificación, traducidos del lado del servidor y bajados
// por props, como los del perfil (`profile-form-texts.ts`): al navegador no le baja
// `messages/es.json`. Lo que llega en tiempo de ejecución —segundos, intentos, números— va como
// plantilla cruda y lo completa el cliente.

const ERROR_KEYS = [
  'session',
  'number_empty',
  'number_format',
  'number_landline',
  'number_foreign',
  'number_unreachable',
  'same_number',
  'wait',
  'daily_cap',
  'site_cap',
  'send_failed',
  'request_unknown',
  'no_pending',
  'code_format',
  'code_wrong',
  'code_exhausted',
  'code_expired',
  'code_superseded',
  'number_in_use',
  'check_failed',
] as const

async function errorTexts(): Promise<Record<string, string>> {
  const t = await getTranslations('verification.errors')
  return Object.fromEntries(
    ERROR_KEYS.map((key) => [`verification.errors.${key}`, String(t.raw(key))]),
  )
}

async function retryTexts(): Promise<RetryTexts> {
  const t = await getTranslations('verification.next')
  return {
    secondsOne: t('seconds_one'),
    secondsMany: String(t.raw('seconds_many')),
    today: String(t.raw('today')),
    tomorrow: String(t.raw('tomorrow')),
    weekday: String(t.raw('weekday')),
  }
}

export async function phoneNumberFormTexts(): Promise<PhoneNumberFormTexts> {
  const t = await getTranslations('verification.screen')
  return {
    label: t('number_label'),
    hint: t('number_hint'),
    submit: t('submit'),
    errors: await errorTexts(),
    retry: await retryTexts(),
  }
}

export async function phoneCodeFormTexts(): Promise<PhoneCodeFormTexts> {
  const t = await getTranslations('verification.code')
  const errors = await getTranslations('verification.errors')
  return {
    label: t('label'),
    submit: t('submit'),
    help: t('help'),
    resend: t('resend'),
    resent: String(t.raw('resent')),
    attempts: { one: t('attempts_one'), many: String(t.raw('attempts_many')) },
    errors: await errorTexts(),
    inUseWays: errors('number_in_use_ways'),
    verifyOther: errors('verify_other'),
    continue: errors('continue'),
    retry: await retryTexts(),
  }
}

// Cuándo puede pedir esta cuenta, decidido acá y no en el navegador, que puede tener el reloj
// corrido (FR-010a).
export async function codeAvailability(userId: string): Promise<RetryDisplay> {
  return retryDisplay(await nextPhoneCodeAt(userId), new Date(), {
    timeZone: URUGUAY_TIME_ZONE,
    locale: await getLocale(),
  })
}

// "Nivel 1 desde el 20 de septiembre de 2026": una fecha, no "hace 3 días", en hora de Uruguay.
async function levelSince(status: PhoneStatus): Promise<string | null> {
  if (status.kind !== 'verified') return null
  const t = await getTranslations('verification.status')
  const format = await getFormatter()
  return t('level_since', { date: format.dateTime(status.since, { dateStyle: 'long' }) })
}

export async function gateTexts(
  reason: GateReason | null,
): Promise<{ title: string; lead: string; reason: string } | null> {
  if (reason === null) return null
  const t = await getTranslations('verification.gate')
  return reason === 'publish'
    ? { title: t('publish_title'), lead: t('publish_lead'), reason: t('publish_reason') }
    : { title: t('apply_title'), lead: t('apply_lead'), reason: t('apply_reason') }
}

export async function verifyScreenTexts(
  status: PhoneStatus,
  reason: GateReason | null,
): Promise<VerifyPhoneScreenTexts> {
  const t = await getTranslations('verification.screen')
  const privacy = await getTranslations('verification.privacy')
  const s = await getTranslations('verification.status')
  const gate = await gateTexts(reason)
  return {
    title: t('title'),
    lead: t('lead'),
    titlePending: t('title_pending'),
    titleVerified: t('title_verified'),
    numberLabelNew: t('number_label_new'),
    finish: t('finish'),
    cancel: t('cancel'),
    correctTitle: t('correct_title'),
    changeTitle: t('change_title'),
    changeWarning: t('change_warning'),
    notNow: t('not_now'),
    privacy: { private: privacy('private'), revealed: privacy('revealed') },
    verifiedStamp: s('verified_stamp'),
    pendingStamp: s('pending_stamp'),
    pendingBody: s('pending_body'),
    pendingRestores: String(s.raw('pending_restores')),
    levelSince: await levelSince(status),
    gate: gate === null ? null : { title: gate.title, lead: gate.lead },
  }
}

export async function statusCardTexts(status: PhoneStatus): Promise<PhoneStatusCardTexts> {
  const s = await getTranslations('verification.status')
  const t = await getTranslations('verification.screen')
  return {
    verifiedStamp: s('verified_stamp'),
    levelSince: await levelSince(status),
    change: s('change'),
    pendingStamp: s('pending_stamp'),
    pendingBody: s('pending_body'),
    pendingRestores: String(s.raw('pending_restores')),
    finish: t('finish'),
    correct: s('correct'),
    cancel: t('cancel'),
    noneTitle: s('none_title'),
    noneBody: s('none_body'),
    noneAction: s('none_action'),
  }
}
