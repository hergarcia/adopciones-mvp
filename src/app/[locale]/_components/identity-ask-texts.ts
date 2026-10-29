import { getTranslations } from 'next-intl/server'
import type { IdentityAskTexts } from '@/components/applications/identity-ask-dialog'
import type { IdentityAskNoteTexts } from '@/components/applications/identity-ask-note'
import {
  shortDayLabel,
  type MyIdentityAskView,
  type PublisherIdentityAskView,
} from '@/lib/applications/identity-ask'
import { IDENTITY_ASK_OUTCOMES, type IdentityAskOutcome } from '@/lib/applications/response-outcome'
import { IDENTITY_EXPECTED_REVIEW_DAYS } from '@/lib/verification/rules'
import { badgeLabel } from './level-texts'

// Los textos del pedido de identidad (historia #257), armados en el servidor: la confirmación, la
// línea debajo del estado, el aviso con el que vuelve la solicitud y la nota de Mi solicitud.

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

/** «Le pediste la identidad el 29/10.» con «Todavía no la verificó.» mientras espera; null sin línea. */
export async function identityAskLineTexts(
  view: PublisherIdentityAskView,
): Promise<{ asked: string; status: string | null } | null> {
  if (view.kind !== 'waiting' && view.kind !== 'asked_only') return null
  const t = await getTranslations('inbox.identity_ask')
  return {
    asked: t('asked', { date: shortDayLabel(view.askedOn) }),
    status: view.kind === 'waiting' ? t('waiting') : null,
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

function noteLines(view: MyIdentityAskView, t: NoteT): string[] {
  switch (view.kind) {
    case 'retry':
      return [t(`retry_${view.after}`)]
    case 'in_review':
      return [t('in_review_wait', { days: IDENTITY_EXPECTED_REVIEW_DAYS })]
    case 'capped':
      return [t('capped', { date: shortDayLabel(view.retryOn) })]
    default:
      return []
  }
}

/**
 * La nota de Mi solicitud: quién pide la identidad y qué se pide, con el pie según su pedido de
 * verificación; ya verificada, solo que quien publicó lo ve.
 */
export async function identityAskNoteTexts(
  view: Exclude<MyIdentityAskView, { kind: 'none' }>,
  names: { pet: string; publisher: string | null },
): Promise<IdentityAskNoteTexts> {
  const t = await getTranslations('applications.identity_ask')
  if (view.kind === 'verified') {
    return {
      title: t('title_verified'),
      who: null,
      badge: null,
      body: null,
      lines: [t('verified_seen', { name: names.pet })],
      stamp: t('verified'),
      action: null,
    }
  }
  const publisher = names.publisher ?? t('publisher_fallback')
  const level = view.publisherLevel
  return {
    title: t('title', { name: names.pet }),
    who: level === null ? publisher : t('who', { name: publisher, level }),
    badge: level === null || level === 0 ? null : await badgeLabel(level, true),
    body: t('body'),
    lines: noteLines(view, t),
    stamp: view.kind === 'in_review' ? t('in_review') : null,
    action: view.kind === 'retry' ? t('retry') : view.kind === 'verify' ? t('verify') : null,
  }
}
