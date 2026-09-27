import { getTranslations } from 'next-intl/server'
import type { IdentityStatusViewTexts } from '@/components/verification/identity-status-view'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import { IDENTITY_EXPECTED_REVIEW_DAYS } from '@/lib/verification/rules'
import {
  EMAIL,
  IDENTITY_NEW_PATH,
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
  const base = {
    stamp: stamps(status.kind),
    payoff: null,
    back: t('back'),
    action: null,
    withdraw: null,
  }

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
        // Primero lo que ganó con el paso más pesado del producto, no el título repetido.
        payoff: levelOne
          ? { title: t('approved_level_title'), body: t('approved_level_body') }
          : null,
        lines: [
          ...(levelOne ? [] : [t('approved_needs_phone')]),
          t('approved_since', { date: await day(status.on) }),
          t('images_deleted'),
        ],
        action: levelOne ? null : { label: t('verify_phone'), href: phoneHref },
      }
    case 'rejected':
    case 'capped': {
      const reason = await rejectionTexts(status.reason)
      const because = t('rejected_reason', { reason: reason.inline })
      if (status.kind === 'capped') {
        // Sin intentos, el consejo va después del día en que puede volver, como algo para esa vez; y
        // la dirección de ayuda se nombra una sola vez, así que si el consejo ya la trae no se repite.
        const help = reason.advice.includes(EMAIL.email) ? [] : [t('help', EMAIL)]
        return {
          ...base,
          title: t('capped_title'),
          lines: [
            because,
            t('images_deleted'),
            t('capped_body', { date: await day(status.retryOn) }),
            reason.advice,
            ...help,
          ],
        }
      }
      return {
        ...base,
        title: t('rejected_title'),
        lines: [
          because,
          reason.advice,
          t('images_deleted'),
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
