import type { getTranslations } from 'next-intl/server'
import { orderQueues, queueStanding, waitParts } from './queues'
import { QUEUE_KEYS, type DigestClaim } from './types'
import { spanText, waitText, type HomeTranslator } from './wait-phrases'

type DigestTranslator = Awaited<ReturnType<typeof getTranslations<'emails.admin_digest'>>>

export type DigestTexts = { digest: DigestTranslator; home: HomeTranslator }

/** Cuántas cosas esperan a esa persona, para el asunto y el título del resumen. */
export function digestTotal(claim: DigestClaim): number {
  return QUEUE_KEYS.reduce((sum, queue) => sum + claim[queue].count, 0)
}

/**
 * Una línea por cola con algo que esa persona puede resolver, en el orden de Administrar, con las
 * esperas del momento en que se arma (FR-061). Solo cuántos y desde cuándo: ningún dato de nadie
 * (FR-062).
 */
export function digestLines(claim: DigestClaim, now: Date, t: DigestTexts): string[] {
  const queues = QUEUE_KEYS.map((queue) => ({
    queue,
    standing: queueStanding(queue, claim[queue].oldest, now),
  }))
  return orderQueues(queues).flatMap(({ queue, standing }) => {
    if (standing.kind === 'clear') return []
    const values = {
      queue: t.digest(`queues.${queue}`, { count: claim[queue].count }),
      wait: waitText(t.home, waitParts(standing.waitedMs)),
    }
    if (standing.kind === 'on_time') return [t.digest('line', values)]
    return [
      t.digest('line_overdue', { ...values, over: spanText(t.home, waitParts(standing.overMs)) }),
    ]
  })
}
