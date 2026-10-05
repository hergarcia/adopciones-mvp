import { getLocale, getTranslations } from 'next-intl/server'
import type { ProfileSafetyTexts } from '@/components/moderation/profile-safety-actions'
import type { ReportDecisionTexts } from '@/components/moderation/report-decision'
import type { ReactivateSheetTexts } from '@/components/moderation/reactivate-sheet'
import type { SuspendSheetTexts } from '@/components/moderation/suspend-sheet'

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
  viewer: { signedIn: boolean; canSuspend: boolean },
): Promise<ProfileSafetyTexts> {
  const [safety, t, errors] = await Promise.all([
    getTranslations('moderation.safety'),
    getTranslations('moderation.report'),
    getTranslations('moderation.errors'),
  ])
  const submit = t('submit')
  const base = { report: safety('report'), suspend: safety('suspend') }
  if (!viewer.signedIn) return { ...base, sheet: null, suspendSheet: null }
  return {
    ...base,
    suspendSheet: viewer.canSuspend ? await suspendSheetTexts(name) : null,
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
  const [t, errors, safety, suspend] = await Promise.all([
    getTranslations('moderation.reports'),
    getTranslations('moderation.errors'),
    getTranslations('moderation.safety'),
    getTranslations('moderation.suspend'),
  ])
  const action = t('close_dialog.confirm')
  return {
    suspend: safety('suspend'),
    suspendSheet: await suspendSheetTexts(name),
    suspendDone: suspend('done', { name }),
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

const SUSPEND_ERRORS = ['reason_required', 'reason_too_long', 'self'] as const

// La hoja de suspender, con el nombre de la persona; la usan el perfil y cada reporte de la lista.
export async function suspendSheetTexts(name: string): Promise<SuspendSheetTexts> {
  const [t, report, errors, locale] = await Promise.all([
    getTranslations('moderation.suspend'),
    getTranslations('moderation.report'),
    getTranslations('moderation.errors'),
    getLocale(),
  ])
  const submit = t('submit')
  return {
    title: t('title', { name }),
    consequencesLabel: t('consequences_label'),
    consequences: [t('consequences.use'), t('consequences.hidden'), t('consequences.email')],
    reasonLabel: t('reason_label'),
    note: t('note', { name }),
    submit,
    cancel: t('cancel'),
    close: t('close'),
    counts: {
      left: { one: report('counts.left.one'), many: String(report.raw('counts.left.many')) },
      over: { one: report('counts.over.one'), many: String(report.raw('counts.over.many')) },
    },
    failures: {
      offline: errors('offline', { action: submit }),
      no_response: errors('failed', { action: submit }),
    },
    errors: Object.fromEntries(
      SUSPEND_ERRORS.map((key) => [`moderation.errors.${key}`, errors(key)]),
    ),
    // `{name}` y `{date}` quedan para la hoja, que los reemplaza.
    already: errors('already_suspended', { name: '{name}', date: '{date}' }),
    alreadyDeleted: errors('already_suspended_deleted', { date: '{date}' }),
    locale,
  }
}

// Reactivar desde la lista de suspendidas, con el nombre de la persona.
export async function reactivateSheetTexts(name: string): Promise<ReactivateSheetTexts> {
  const [t, errors] = await Promise.all([
    getTranslations('moderation.suspended_list'),
    getTranslations('moderation.errors'),
  ])
  const action = t('reactivate_sheet.confirm')
  return {
    trigger: t('reactivate'),
    title: t('reactivate_sheet.title', { name }),
    body: t('reactivate_sheet.body'),
    confirm: action,
    cancel: t('reactivate_sheet.cancel'),
    close: t('reactivate_sheet.close'),
    done: t('done', { name }),
    failures: {
      offline: errors('offline', { action }),
      no_response: errors('failed', { action }),
    },
    // `{name}` queda para la fila, que lo reemplaza por quién la reactivó.
    already: errors('already_reactivated', { name: '{name}' }),
    alreadyDeleted: errors('already_reactivated_deleted'),
    gone: errors('gone'),
  }
}
