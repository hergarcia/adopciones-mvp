import { getTranslations } from 'next-intl/server'
import type { ReviewDecisionTexts } from '@/components/verification/review-decision'
import type { ReviewQueueRow } from '@/components/verification/review-queue-list'
import type { ReviewRequestViewTexts } from '@/components/verification/review-request-view'
import type { ReviewClosedTexts } from '@/components/verification/review-watcher'
import type { ReviewQueueItem, ReviewRequest } from '@/lib/supabase/queries/review-queue'
import { departmentName } from '@/lib/zones/departments'
import { day, instant } from './identity-texts'

// Los textos de la cola de revisión, traducidos del lado del servidor y con sus fechas ya puestas.

const REVIEW_ERROR_KEYS = ['closed', 'own_request', 'not_admin', 'resolve_failed'] as const

export async function reviewQueueRows(items: ReviewQueueItem[]): Promise<ReviewQueueRow[]> {
  const t = await getTranslations('review.queue')
  return Promise.all(
    items.map(async (item) => ({
      id: item.id,
      name: item.displayName,
      waitingSince: t('waiting_since', { date: (await instant(item.sentAt)).date }),
      expires: t('expires', await instant(item.expiresAt)),
      isOwn: item.isOwn,
    })),
  )
}

export async function reviewCount(count: number): Promise<string> {
  const t = await getTranslations('review.queue')
  if (count === 0) return t('count_none')
  return count === 1 ? t('count_one') : t('count_many', { count })
}

export async function reviewRequestTexts(request: ReviewRequest): Promise<ReviewRequestViewTexts> {
  const t = await getTranslations('review.request')
  const reasons = await getTranslations('identity.rejection')
  const image = (kind: 'front' | 'selfie') => ({
    title: t(kind),
    alt: t(`${kind}_alt`, { name: request.displayName }),
    failed: t('image_failed'),
    retry: t('image_retry'),
  })
  const rejections = await Promise.all(
    request.rejections.map(async (rejection) =>
      t('rejection', {
        date: await day(rejection.rejectedOn),
        reason: reasons(`${rejection.reason}.label`),
      }),
    ),
  )
  return {
    name: request.displayName,
    zone: `${request.locality}, ${departmentName(request.department)}`,
    memberSince: t('member_since', { date: (await instant(request.memberSince)).date }),
    waitingSince: t('waiting_since', { date: (await instant(request.sentAt)).date }),
    expires: t('expires', await instant(request.expiresAt)),
    rejectionsTitle: rejections.length === 0 ? t('no_rejections') : t('rejections_title'),
    rejections,
    rule: t('rule'),
    front: image('front'),
    selfie: image('selfie'),
  }
}

export async function reviewDecisionTexts(name: string): Promise<ReviewDecisionTexts> {
  const t = await getTranslations('review.request')
  const reasons = await getTranslations('identity.rejection')
  const errors = await getTranslations('review.errors')
  return {
    approve: t('approve'),
    reject: t('reject'),
    rejectTitle: t('reject_title', { name }),
    close: t('close'),
    reasons: {
      unreadable: reasons('unreadable.label'),
      mismatch: reasons('mismatch.label'),
      expired_document: reasons('expired_document.label'),
      suspected_fraud: reasons('suspected_fraud.label'),
    },
    errors: Object.fromEntries(
      REVIEW_ERROR_KEYS.map((key) => [`review.errors.${key}`, errors(key)]),
    ),
  }
}

export async function reviewClosedTexts(name: string): Promise<ReviewClosedTexts> {
  const t = await getTranslations('review.closed')
  const request = await getTranslations('review.request')
  return {
    title: name,
    resolved: t('resolved'),
    expired: t('expired'),
    gone: t('gone'),
    back: request('back'),
  }
}
