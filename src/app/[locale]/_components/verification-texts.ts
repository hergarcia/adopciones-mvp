import { getTranslations } from 'next-intl/server'
import type { PhoneCodeFormTexts } from '@/components/verification/phone-code-form'
import type { PhoneNumberFormTexts } from '@/components/verification/phone-number-form'
import type { GateReason } from '@/lib/verification/gate'
import type { RetryTexts } from '@/lib/verification/retry-at'

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
    inUseTitle: t('in_use_title'),
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

export async function gateTexts(
  reason: GateReason | null,
): Promise<{ title: string; lead: string; reason: string } | null> {
  if (reason === null) return null
  const t = await getTranslations('verification.gate')
  return reason === 'publish'
    ? { title: t('publish_title'), lead: t('publish_lead'), reason: t('publish_reason') }
    : { title: t('apply_title'), lead: t('apply_lead'), reason: t('apply_reason') }
}
