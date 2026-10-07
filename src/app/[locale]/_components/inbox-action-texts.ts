import { getTranslations } from 'next-intl/server'
import type { AcceptTexts } from '@/components/applications/accept-dialog'

// Los textos de lo que el publicador hace en una solicitud (historia #65): aceptar y la oferta de
// «En proceso» que le sigue.

const ACCEPT_ERRORS = [
  'gone',
  'you_blocked',
  'closed',
  'rejected',
  'applicant_needs_phone',
  'publisher_needs_phone',
  'not_found',
  'failed',
] as const

export async function acceptTexts(name: string): Promise<AcceptTexts> {
  const [t, errors] = await Promise.all([
    getTranslations('inbox.accept'),
    getTranslations('inbox.errors'),
  ])
  return {
    trigger: t('trigger'),
    title: t('title', { name }),
    body: t('body', { name }),
    confirm: t('confirm'),
    cancel: t('cancel'),
    close: t('close'),
    errors: Object.fromEntries(
      ACCEPT_ERRORS.map((key) => [`inbox.errors.${key}`, errors(key, { name })]),
    ),
  }
}

const PET_ERRORS = [
  'changed',
  'needs_verification',
  'taken_down',
  'not_found',
  'session',
  'failed',
] as const

/** La oferta de «En proceso», con los errores de cambiar el estado del animal. */
export async function offerTexts(petName: string, sex: string | null) {
  const [t, errors] = await Promise.all([
    getTranslations('inbox.offer'),
    getTranslations('pets.status.errors'),
  ])
  const values = { name: petName, sex: sex ?? 'male', action: t('action') }
  return {
    body: t('body', { pet: petName }),
    action: values.action,
    errors: Object.fromEntries(
      PET_ERRORS.map((key) => [`pets.status.errors.${key}`, errors(key, values)]),
    ),
  }
}

/** Lo de aceptar al pie: la confirmación y la línea de quien tiene que volver a verificar. */
export async function responseActionTexts(name: string) {
  const t = await getTranslations('inbox.actions')
  return {
    accept: await acceptTexts(name),
    applicantNeedsPhone: t('applicant_needs_phone', { name }),
  }
}
