import { getTranslations } from 'next-intl/server'
import { ALERTS_MAX } from '@/lib/alerts/rules'
import type { AlertOfferTexts } from './alert-offer'

export async function alertOfferTexts(): Promise<AlertOfferTexts> {
  const t = await getTranslations('alerts.offer')
  return {
    create: t('create'),
    created: t('created'),
    duplicate: t('duplicate'),
    limit: t('limit', { max: ALERTS_MAX }),
    myAlerts: t('my_alerts'),
    deleteOne: t('delete_one'),
    failed: t('failed'),
  }
}
