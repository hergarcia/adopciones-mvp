import { getTranslations } from 'next-intl/server'
import type { ProfileSafetyTexts } from '@/components/moderation/profile-safety-actions'
import type { ReportDecisionTexts } from '@/components/moderation/report-decision'

const REPORT_ERRORS = [
  'duplicate',
  'self',
  'not_found',
  'details_required',
  'details_too_long',
  'reason_required',
] as const

// Los textos de reportar desde el perfil, con el nombre de la persona. Los errores de envío nombran
// el botón, porque reintentar es tocarlo de nuevo (docs/10 §Principios 6).
export async function profileSafetyTexts(
  name: string,
  signedIn: boolean,
): Promise<ProfileSafetyTexts> {
  const [safety, t, errors] = await Promise.all([
    getTranslations('moderation.safety'),
    getTranslations('moderation.report'),
    getTranslations('moderation.errors'),
  ])
  const submit = t('submit')
  if (!signedIn) return { report: safety('report'), sheet: null }
  return {
    report: safety('report'),
    sheet: {
      title: t('title', { name }),
      legend: t('legend'),
      reasons: {
        scam: t('reasons.scam'),
        animal_abuse: t('reasons.animal_abuse'),
        sells_animals: t('reasons.sells_animals'),
        impersonation: t('reasons.impersonation'),
        harassment: t('reasons.harassment'),
        other: t('reasons.other'),
      },
      detailsLabel: t('details_label'),
      detailsLabelRequired: t('details_label_required'),
      counts: {
        left: { one: t('counts.left.one'), many: String(t.raw('counts.left.many')) },
        over: { one: t('counts.over.one'), many: String(t.raw('counts.over.many')) },
      },
      anonymity: t('anonymity', { name }),
      submit,
      cancel: t('cancel'),
      close: t('close'),
      sentTitle: t('sent_title'),
      sentBody: t('sent_body'),
      blockOffer: t('block_offer', { name }),
      back: t('back'),
      failures: {
        offline: errors('offline', { action: submit }),
        no_response: errors('failed', { action: submit }),
      },
      errors: Object.fromEntries(
        REPORT_ERRORS.map((key) => [`moderation.errors.${key}`, errors(key)]),
      ),
    },
  }
}

// Las acciones de un reporte de la lista, con el nombre de la persona reportada.
export async function reportDecisionTexts(name: string): Promise<ReportDecisionTexts> {
  const [t, errors] = await Promise.all([
    getTranslations('moderation.reports'),
    getTranslations('moderation.errors'),
  ])
  const action = t('close_dialog.confirm')
  return {
    close: {
      trigger: t('close'),
      title: t('close_dialog.title'),
      body: t('close_dialog.body', { name }),
      confirm: action,
      cancel: t('close_dialog.cancel'),
      close: t('close_dialog.close'),
    },
    done: t('done', { name }),
    failures: {
      offline: errors('offline', { action }),
      no_response: errors('failed', { action }),
    },
    own: errors('own'),
    gone: t('settled_gone'),
    // `{name}` queda para la hoja, que lo reemplaza por quién lo cerró.
    closedBy: {
      dismissed: t('settled_closed', { resolution: 'dismissed', name: '{name}' }),
      suspended: t('settled_closed', { resolution: 'suspended', name: '{name}' }),
    },
    closedByDeleted: {
      dismissed: t('settled_closed_deleted', { resolution: 'dismissed' }),
      suspended: t('settled_closed_deleted', { resolution: 'suspended' }),
    },
  }
}
