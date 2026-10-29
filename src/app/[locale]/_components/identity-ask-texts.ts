import { getLocale, getTranslations } from 'next-intl/server'
import type { IdentityAskTexts } from '@/components/applications/identity-ask-dialog'
import type { IdentityAskNoteTexts } from '@/components/applications/identity-ask-note'
import type { MyIdentityAskView, PublisherIdentityAskView } from '@/lib/applications/identity-ask'
import { IDENTITY_ASK_OUTCOMES, type IdentityAskOutcome } from '@/lib/applications/response-outcome'
import { calendarDayLabel } from '@/lib/moderation/day-label'
import { IDENTITY_EXPECTED_REVIEW_DAYS } from '@/lib/verification/rules'
import { badgeLabel } from './level-texts'

export async function identityAskDialogTexts(name: string): Promise<IdentityAskTexts> {
  const t = await getTranslations('inbox.identity_ask')
  return {
    trigger: t('trigger'),
    title: t('title', { name }),
    body: t('body'),
    confirm: t('confirm'),
    retry: t('retry'),
    cancel: t('cancel'),
    close: t('close'),
    failed: t('errors.failed'),
  }
}

export async function identityAskLineTexts(
  view: PublisherIdentityAskView,
): Promise<{ asked: string; status: string | null } | null> {
  if (view.kind === 'offer' || view.kind === 'none') return null
  const [t, locale] = await Promise.all([getTranslations('inbox.identity_ask'), getLocale()])
  const asked = t('asked', { date: calendarDayLabel(view.askedOn, locale) })
  switch (view.kind) {
    case 'waiting':
      return { asked, status: t('waiting') }
    case 'verified':
      return { asked, status: t('verified', { date: calendarDayLabel(view.verifiedOn, locale) }) }
    default:
      return { asked, status: null }
  }
}

/**
 * El aviso de la solicitud a la que vuelve la confirmación: hecho, ya verificada, o por qué ya no se
 * puede pedir con el texto de aceptar y preguntar (FR-007). Una marca que no es un resultado no dice
 * nada.
 */
export async function identityAskToast(
  flag: string | undefined,
  name: string,
): Promise<{ message: string; variant: 'success' | 'error' } | null> {
  const outcome = IDENTITY_ASK_OUTCOMES.find((candidate) => candidate === flag)
  if (outcome === undefined) return null
  const [t, errors] = await Promise.all([
    getTranslations('inbox.identity_ask'),
    getTranslations('inbox.errors'),
  ])
  const message: Record<IdentityAskOutcome, () => string> = {
    asked: () => t('done', { name }),
    already: () => t('done', { name }),
    verified: () => t('errors.verified', { name }),
    not_waiting: () => t('errors.not_waiting'),
    gone: () => errors('gone', { name }),
    you_blocked: () => errors('you_blocked', { name }),
    closed: () => errors('closed'),
    not_found: () => errors('not_found'),
  }
  return {
    message: message[outcome](),
    variant:
      outcome === 'asked' || outcome === 'already' || outcome === 'verified' ? 'success' : 'error',
  }
}

type NoteT = Awaited<ReturnType<typeof getTranslations<'applications.identity_ask'>>>

function noteLines(view: MyIdentityAskView, t: NoteT, locale: string): string[] {
  switch (view.kind) {
    case 'retry':
      return [t(`retry_${view.after}`)]
    case 'in_review':
      return [t('in_review_wait', { days: IDENTITY_EXPECTED_REVIEW_DAYS })]
    case 'capped':
      return [t('capped', { date: calendarDayLabel(view.retryOn, locale) })]
    default:
      return []
  }
}

export async function identityAskNoteTexts(
  view: Exclude<MyIdentityAskView, { kind: 'none' }>,
  names: { pet: string; publisher: string | null },
): Promise<IdentityAskNoteTexts> {
  const [t, locale] = await Promise.all([getTranslations('applications.identity_ask'), getLocale()])
  const publisher = names.publisher ?? t('publisher_fallback')
  if (view.kind === 'verified') {
    return {
      title: t('title_verified'),
      who: null,
      badge: null,
      body: null,
      lines: [t('verified_seen', { name: publisher })],
      stamp: t('verified'),
      action: null,
    }
  }
  const level = view.publisherLevel
  const canSend = view.kind === 'verify' || view.kind === 'retry'
  return {
    title: t('title', { name: publisher }),
    who: level === null ? null : t('who', { level }),
    badge: level === null || level === 0 ? null : await badgeLabel(level, true),
    body: canSend ? t('body', { name: names.pet }) : null,
    lines: noteLines(view, t, locale),
    stamp: view.kind === 'in_review' ? t('in_review') : null,
    action: view.kind === 'retry' ? t('retry') : view.kind === 'verify' ? t('verify') : null,
  }
}
