'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { getLocale } from 'next-intl/server'
import { z } from 'zod'
import { track } from '@/lib/analytics/track'
import { sendIdentityResult, type IdentityResult } from '@/lib/email/send-identity-result'
import { identityResolutionSchema } from '@/lib/schemas/identity'
import {
  getReviewRequestTrace,
  isAdmin,
  resolveIdentityRequest as resolveRequest,
} from '@/lib/supabase/queries/review'
import { listReviewQueue } from '@/lib/supabase/queries/review-queue'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { reviewState, type ReviewState } from '@/lib/verification/review-state'
import type { ActionResult } from './result'

// Lo de quien administra (historia #11). Quién administra se vuelve a preguntar en cada acción:
// dejar de administrar corta el acceso en ese momento (FR-022b).

const QUEUE_PATH = '/revision'
const HOUR_MS = 60 * 60 * 1000

// Después de resolver, el siguiente más viejo que no sea propio, o la lista (FR-018).
async function nextPath(): Promise<string> {
  const next = (await listReviewQueue().catch(() => [])).find((item) => !item.isOwn)
  return next === undefined ? QUEUE_PATH : `${QUEUE_PATH}/${next.id}`
}

export async function resolveIdentityRequest(
  input: unknown,
): Promise<ActionResult<{ next: string }>> {
  const parsed = identityResolutionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'review.errors.resolve_failed' }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: 'review.errors.not_admin' }

  const resolution = parsed.data
  const reason = resolution.outcome === 'reject' ? resolution.reason : null
  const resolved = await resolveRequest({
    requestId: resolution.requestId,
    adminId: user.id,
    outcome: resolution.outcome,
    reason,
  })

  switch (resolved?.decision) {
    case 'approved':
    case 'rejected':
      break
    case 'gone':
    case 'expired':
      return { ok: false, error: 'review.errors.closed' }
    case 'own_request':
      return { ok: false, error: 'review.errors.own_request' }
    case 'not_admin':
      return { ok: false, error: 'review.errors.not_admin' }
    default:
      return { ok: false, error: 'review.errors.resolve_failed' }
  }

  // Los momentos de quien administra no llevan la marca de su visita (FR-035).
  const reviewHours = Math.round((Date.now() - resolved.sentAt.getTime()) / HOUR_MS)
  const base = { origin: resolved.origin, review_hours: reviewHours }
  let result: IdentityResult
  if (reason === null) {
    await track('identity_request_approved', base, { visit: false })
    result = { kind: 'approved', on: resolved.resolvedOn, levelTwoNow: resolved.levelOne }
  } else {
    await track('identity_request_rejected', { ...base, reason }, { visit: false })
    result = { kind: 'rejected', on: resolved.resolvedOn, reason, retryOn: resolved.retryOn }
  }

  // El correo sale después de responder: la resolución no espera al servicio de correo ni se
  // deshace si falla (FR-026).
  const locale = await getLocale()
  after(() => sendIdentityResult({ userId: resolved.ownerId, result, locale }))

  revalidatePath(QUEUE_PATH)
  return { ok: true, data: { next: await nextPath() } }
}

const checkSchema = z.object({ requestId: z.uuid(), knownExpiresAt: z.iso.datetime().nullable() })

// Lo pregunta `ReviewWatcher` cada 10 segundos y después de un «ya no se puede resolver».
export async function checkReviewRequest(
  requestId: string,
  knownExpiresAt: string | null,
): Promise<ActionResult<{ state: ReviewState }>> {
  const parsed = checkSchema.safeParse({ requestId, knownExpiresAt })
  if (!parsed.success) return { ok: true, data: { state: 'gone' } }
  if (!(await isAdmin().catch(() => false))) return { ok: true, data: { state: 'gone' } }

  const trace = await getReviewRequestTrace(parsed.data.requestId).catch(() => null)
  if (trace === null) return { ok: false, error: 'review.errors.load_error' }
  const known = parsed.data.knownExpiresAt
  return {
    ok: true,
    data: {
      state: reviewState(
        { ...trace, knownExpiresAt: known === null ? null : new Date(known) },
        new Date(),
      ),
    },
  }
}
