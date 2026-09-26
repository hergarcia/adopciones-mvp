import { getFormatter, getLocale, getTranslations } from 'next-intl/server'
import type { IdentityRequestFormTexts } from '@/components/verification/identity-request-form'
import type { IdentityPhotoFieldTexts } from '@/components/verification/identity-photo-field'
import type { WithdrawTexts } from '@/components/verification/withdraw-request-dialog'
import type { RejectionReason } from '@/lib/verification/identity'
import { lostDayLabel } from '@/lib/verification/lost-notice'

// Los textos de la verificación de identidad, traducidos del lado del servidor y bajados por props
// como los del teléfono: al navegador no le baja `messages/es.json`. `{email}` queda crudo donde va
// la dirección de ayuda: lo convierte en enlace `SupportSentence`.

export const IDENTITY_PATH = '/verificar-identidad'
/** La vista de pedir, para quien ve un rechazo o un vencimiento y quiere intentarlo otra vez. */
export const IDENTITY_NEW_PATH = `${IDENTITY_PATH}?pedir=1`
export const EMAIL = { email: '{email}' }

const IDENTITY_ERROR_KEYS = [
  'session',
  'photo_type',
  'photo_too_big',
  'photo_failed',
  'photo',
  'no_phone',
  'already_open',
  'capped',
  'send_failed',
  'not_open',
  'withdraw_failed',
] as const

export async function identityErrorTexts(): Promise<Record<string, string>> {
  const t = await getTranslations('identity.errors')
  return Object.fromEntries(IDENTITY_ERROR_KEYS.map((key) => [`identity.errors.${key}`, t(key)]))
}

/** Un día de calendario, `YYYY-MM-DD`, como fecha larga. */
export async function day(value: string): Promise<string> {
  return lostDayLabel(value, await getLocale())
}

export async function instant(value: Date): Promise<{ date: string; time: string }> {
  const format = await getFormatter()
  return {
    date: format.dateTime(value, { dateStyle: 'long' }),
    time: format.dateTime(value, { timeStyle: 'short' }),
  }
}

export async function rejectionTexts(reason: RejectionReason) {
  const t = await getTranslations('identity.rejection')
  return {
    label: t(`${reason}.label`),
    inline: t(`${reason}.inline`),
    advice: t(`${reason}.advice`, EMAIL),
  }
}

export async function identityRequestFormTexts(): Promise<IdentityRequestFormTexts> {
  const t = await getTranslations('identity.request')
  const errors = await identityErrorTexts()
  const photo = (kind: 'front' | 'selfie'): IdentityPhotoFieldTexts => ({
    title: t(`${kind}_title`),
    hint: t('photo_hint'),
    take: t('take'),
    choose: t('choose'),
    change: t('change'),
    alt: t(`${kind}_alt`),
  })
  return {
    consent: {
      whatTitle: t('what_title'),
      whatBody: t('what_body'),
      useTitle: t('use_title'),
      promises: [t('use_nobody'), t('use_deleted'), t('use_never')],
      details: [t('use_who'), t('use_withdraw'), t('use_kept')],
      accepted: t('accepted'),
      readAgain: t('read_again'),
    },
    front: photo('front'),
    selfie: photo('selfie'),
    selfieExample: t('selfie_example'),
    accept: t('accept'),
    submit: t('submit'),
    notNow: t('not_now'),
    errors,
  }
}

export async function withdrawTexts(): Promise<WithdrawTexts> {
  const t = await getTranslations('identity.withdraw')
  const status = await getTranslations('identity.status')
  const toast = await getTranslations('common.toast')
  return {
    trigger: status('withdraw'),
    title: t('title'),
    body: t('body'),
    confirm: t('confirm'),
    cancel: t('cancel'),
    close: toast('close'),
    errors: await identityErrorTexts(),
  }
}
