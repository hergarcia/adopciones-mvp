import { getTranslations } from 'next-intl/server'
import type { AdminQueueRowProps } from '@/components/admin/admin-queue-row'
import { orderQueues, queueStanding, waitParts } from '@/lib/admin/queues'
import { QUEUE_KEYS, type QueueCount, type QueueKey, type QueueStanding } from '@/lib/admin/types'
import { spanText as span, waitText as wait, type HomeTranslator } from '@/lib/admin/wait-phrases'
import { FEEDBACK_LIST_PATH, SURVEY_SUMMARY_PATH } from '@/lib/feedback/paths'
import { REPORTS_PATH, SUSPENDED_LIST_PATH } from '@/lib/moderation/paths'
import { PET_REVIEW_PATH } from '@/lib/pets/paths'

// Los textos de Administrar, armados del lado del servidor con `messages/` (admin.home).

export const QUEUE_PATHS: Record<QueueKey, string> = {
  identity: '/revision',
  pets: PET_REVIEW_PATH,
  reports: REPORTS_PATH,
}

/** Una cola contada, o `null` si no se pudo (FR-016). */
export type CountedQueue = {
  queue: QueueKey
  count: QueueCount | null
  standing: QueueStanding | null
}

export function countedQueues(
  settled: Record<QueueKey, PromiseSettledResult<QueueCount>>,
  now: Date,
): CountedQueue[] {
  return orderQueues(
    QUEUE_KEYS.map((queue) => {
      const result = settled[queue]
      if (result.status === 'rejected') return { queue, count: null, standing: null }
      return {
        queue,
        count: result.value,
        standing: queueStanding(queue, result.value.oldest, now),
      }
    }),
  )
}

function queueRow(t: HomeTranslator, item: CountedQueue): AdminQueueRowProps & { key: string } {
  const base = { key: item.queue, href: QUEUE_PATHS[item.queue], title: t(`queues.${item.queue}`) }
  const { count, standing } = item
  if (count === null || standing === null) {
    return { ...base, line: t('failed'), overdue: null, quiet: true }
  }
  if (standing.kind === 'clear') return { ...base, line: t('clear'), overdue: null, quiet: true }
  return {
    ...base,
    line: t('waiting', { count: count.others, wait: wait(t, waitParts(standing.waitedMs)) }),
    overdue:
      standing.kind === 'overdue'
        ? t('overdue', { over: span(t, waitParts(standing.overMs)) })
        : null,
    quiet: false,
  }
}

function lead(t: HomeTranslator, queues: CountedQueue[]): string {
  if (queues.some((item) => item.count === null)) return t('lead_unknown')
  const total = queues.reduce((sum, item) => sum + (item.count?.others ?? 0), 0)
  return total === 0 ? t('lead_none') : t('lead', { count: total })
}

function ownItems(t: HomeTranslator, queues: CountedQueue[], now: Date) {
  return QUEUE_KEYS.flatMap((queue) =>
    (queues.find((item) => item.queue === queue)?.count?.own ?? []).map((own, index) => {
      const since = wait(t, waitParts(Math.max(0, now.getTime() - own.since.getTime())))
      return {
        key: `${queue}-${index}`,
        text:
          queue === 'pets'
            ? t('own.pets', { name: own.petName ?? '', wait: since })
            : t(`own.${queue}`, { wait: since }),
      }
    }),
  )
}

function entries(
  t: HomeTranslator,
  recent: PromiseSettledResult<{ feedback: number; surveyAnswers: number }>,
) {
  const counts = recent.status === 'fulfilled' ? recent.value : null
  return [
    { key: 'suspended', href: SUSPENDED_LIST_PATH, label: t('entries.suspended') },
    {
      key: 'feedback',
      href: FEEDBACK_LIST_PATH,
      label:
        counts === null
          ? t('entries.feedback_failed')
          : t('entries.feedback', { count: counts.feedback }),
    },
    {
      key: 'surveys',
      href: SURVEY_SUMMARY_PATH,
      label:
        counts === null
          ? t('entries.surveys_failed')
          : t('entries.surveys', { count: counts.surveyAnswers }),
    },
  ]
}

export async function adminHomeTexts(
  queues: CountedQueue[],
  recent: PromiseSettledResult<{ feedback: number; surveyAnswers: number }>,
  now: Date,
) {
  const t = await getTranslations('admin.home')
  return {
    title: t('title'),
    lead: lead(t, queues),
    board: { label: t('queues_label'), rows: queues.map((item) => queueRow(t, item)) },
    own: { title: t('own_title'), items: ownItems(t, queues, now) },
    entries: { label: t('entries_label'), entries: entries(t, recent) },
  }
}
