import { getTranslations } from 'next-intl/server'
import type { IdentityAskTexts } from '@/components/applications/identity-ask-dialog'
import { shortDayLabel, type PublisherIdentityAskView } from '@/lib/applications/identity-ask'
import { IDENTITY_ASK_OUTCOMES, type IdentityAskOutcome } from '@/lib/applications/response-outcome'

// Los textos del pedido de identidad (historia #257), armados en el servidor: la confirmación, la
// línea debajo del estado y el aviso con el que vuelve la solicitud.

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
