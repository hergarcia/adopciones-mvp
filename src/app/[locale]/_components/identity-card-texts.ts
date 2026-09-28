import { getTranslations } from 'next-intl/server'
import type { IdentityStatusCardTexts } from '@/components/verification/identity-status-card'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import { IDENTITY_PATH, day, instant } from './identity-texts'

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
            headline: t('offer_title'),
            stamp: null,
            lines: [t('offer')],
            action: { label: t('start'), href: IDENTITY_PATH, variant: 'secondary' },
          }
        : { ...base, stamp: null, lines: [t('needs_phone')], action: null, quiet: true }
    case 'approved': {
      const verified = t('verified_on', { date: await day(status.on) })
      return levelOne
        ? { ...base, stamp: stamps('approved'), lines: [t('level_two'), verified], action: null }
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
