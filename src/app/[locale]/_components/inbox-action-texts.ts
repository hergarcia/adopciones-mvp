import { getTranslations } from 'next-intl/server'
import type { AcceptTexts } from '@/components/applications/accept-dialog'
import type { RejectSheetTexts } from '@/components/applications/reject-sheet'

// Los textos de lo que el publicador hace en una solicitud (historia #65): aceptar y la oferta de
// «En proceso» que le sigue, rechazar y dejar sin efecto.

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

const REJECT_ERRORS = [
  'missing_reason',
  'missing_note',
  'note_too_long',
  'gone',
  'you_blocked',
  'closed',
  'accepted',
  'not_accepted',
  'not_found',
  'failed',
] as const
const CONTACT_ERRORS = ['contact_phone', 'contact_email', 'contact_web', 'contact_social'] as const

/** Rechazar o dejar sin efecto: la hoja con los motivos, la línea de «otro» y sus errores. */
export async function rejectSheetTexts(
  name: string,
  mode: 'reject' | 'revoke',
): Promise<RejectSheetTexts> {
  const [t, actions, reasons, counts, errors] = await Promise.all([
    getTranslations(`inbox.${mode}`),
    getTranslations('inbox.actions'),
    getTranslations('inbox.reasons'),
    getTranslations('inbox.counts'),
    getTranslations('inbox.errors'),
  ])
  return {
    trigger: actions(mode),
    title: t('title', { name }),
    legend: t('legend'),
    reasons: {
      not_concluded: reasons('not_concluded'),
      chose_other: reasons('chose_other'),
      housing: reasons('housing'),
      alone_too_long: reasons('alone_too_long'),
      no_neuter_commitment: reasons('no_neuter_commitment'),
      household_fit: reasons('household_fit'),
      no_answer: reasons('no_answer'),
      other: reasons('other'),
    },
    noteLabel: t('note_label'),
    private: t('private', { name }),
    confirm: t('confirm'),
    cancel: t('cancel'),
    close: t('close'),
    counts: {
      left: { one: counts('left.one'), many: String(counts.raw('left.many')) },
      over: { one: counts('over.one'), many: String(counts.raw('over.many')) },
    },
    errors: Object.fromEntries([
      ...REJECT_ERRORS.map((key) => [`inbox.errors.${key}`, errors(key, { name })]),
      // Los de contacto bajan crudos: el fragmento lo pone el cliente.
      ...CONTACT_ERRORS.map((key) => [`inbox.errors.${key}`, String(errors.raw(key))]),
    ]),
  }
}

/** Lo de responder al pie: aceptar, la línea de quien tiene que volver a verificar y rechazar. */
export async function responseActionTexts(name: string) {
  const t = await getTranslations('inbox.actions')
  return {
    accept: await acceptTexts(name),
    applicantNeedsPhone: t('applicant_needs_phone', { name }),
    reject: await rejectSheetTexts(name, 'reject'),
  }
}
