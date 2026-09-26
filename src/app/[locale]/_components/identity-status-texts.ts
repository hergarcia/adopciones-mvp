import { getTranslations } from 'next-intl/server'
import type { IdentityStatusCardTexts } from '@/components/verification/identity-status-card'
import type { IdentityStatusViewTexts } from '@/components/verification/identity-status-view'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import { IDENTITY_EXPECTED_REVIEW_DAYS } from '@/lib/verification/rules'
import {
  EMAIL,
  IDENTITY_NEW_PATH,
  IDENTITY_PATH,
  day,
  instant,
  rejectionTexts,
  withdrawTexts,
} from './identity-texts'

// Lo que dice cada estado (§Pantallas, Estado de mi pedido), y su tirita si hay algo que hacer.
export async function identityStatusTexts(
  status: Exclude<IdentityStatus, { kind: 'none' }>,
  levelOne: boolean,
  phoneHref: string,
): Promise<IdentityStatusViewTexts> {
  const t = await getTranslations('identity.status')
  const stamps = await getTranslations('identity.stamps')
  const base = { stamp: stamps(status.kind), back: t('back'), action: null, withdraw: null }

  switch (status.kind) {
    case 'in_review': {
      const expires = await instant(status.expiresAt)
      return {
        ...base,
        title: t('in_review_title'),
        lines: [
          t('in_review_sent', { date: (await instant(status.sentAt)).date }),
          t('in_review_wait', { days: IDENTITY_EXPECTED_REVIEW_DAYS }),
          t('in_review_expires', expires),
        ],
        withdraw: await withdrawTexts(),
      }
    }
    case 'approved':
      return {
        ...base,
        title: t('approved_title'),
        lines: [
          t('approved_since', { date: await day(status.on) }),
          levelOne ? t('approved_level') : t('approved_needs_phone'),
          t('images_deleted'),
        ],
        action: levelOne ? null : { label: t('verify_phone'), href: phoneHref },
      }
    case 'rejected':
    case 'capped': {
      const reason = await rejectionTexts(status.reason)
      const lines = [
        t('rejected_reason', { reason: reason.inline }),
        reason.advice,
        t('images_deleted'),
      ]
      if (status.kind === 'capped') {
        return {
          ...base,
          title: t('capped_title'),
          lines: [
            ...lines,
            t('capped_body', { date: await day(status.retryOn) }),
            t('help', EMAIL),
          ],
        }
      }
      return {
        ...base,
        title: t('rejected_title'),
        lines: [
          ...lines,
          status.attemptsLeft === 1
            ? t('attempts_one')
            : t('attempts_many', { count: status.attemptsLeft }),
        ],
        action: { label: t('retry'), href: IDENTITY_NEW_PATH },
      }
    }
    default:
      return {
        ...base,
        title: t('expired_title'),
        lines: [t('expired_on', { date: await day(status.on) }), t('expired_body')],
        action: { label: t('request_again'), href: IDENTITY_NEW_PATH },
      }
  }
}

// «Tu identidad» en «Mi perfil», en todas las combinaciones de FR-024.
export async function identityCardTexts(
  status: IdentityStatus,
  levelOne: boolean,
): Promise<IdentityStatusCardTexts> {
  const t = await getTranslations('identity.card')
  const stamps = await getTranslations('identity.stamps')
  const see = { label: t('see_request'), href: IDENTITY_PATH, variant: 'ghost' as const }
  const base = { label: t('label') }

  switch (status.kind) {
    case 'none':
      return levelOne
        ? {
            ...base,
            stamp: null,
            lines: [t('offer')],
            action: { label: t('start'), href: IDENTITY_PATH, variant: 'secondary' },
          }
        : { ...base, stamp: null, lines: [t('needs_phone')], action: null }
    case 'approved': {
      const verified = t('verified_on', { date: await day(status.on) })
      return levelOne
        ? { ...base, stamp: stamps('approved'), lines: [verified], action: null }
        : { ...base, stamp: null, lines: [verified, t('back_with_phone')], action: null }
    }
    case 'in_review':
      return {
        ...base,
        stamp: stamps('in_review'),
        lines: [t('in_review', { date: (await instant(status.sentAt)).date })],
        action: see,
      }
    case 'rejected':
      return {
        ...base,
        stamp: stamps('rejected'),
        lines: [t('rejected', { date: await day(status.on) })],
        action: see,
      }
    case 'expired':
      return {
        ...base,
        stamp: stamps('expired'),
        lines: [t('expired', { date: await day(status.on) })],
        action: see,
      }
    default:
      return {
        ...base,
        stamp: stamps('capped'),
        lines: [t('capped', { date: await day(status.retryOn) })],
        action: see,
      }
  }
}
