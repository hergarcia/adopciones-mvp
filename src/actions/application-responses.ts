'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  applicationAcceptedEvents,
  inProcessFromOfferEvent,
} from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'
import {
  INBOX_PATH,
  MY_APPLICATIONS_PATH,
  myApplicationPath,
  petInboxPath,
  publisherApplicationPath,
} from '@/lib/applications/paths'
import { acceptOutcome, type AcceptResult } from '@/lib/applications/response-outcome'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import { acceptApplicationRecord } from '@/lib/supabase/queries/application-response-records'
import { getPublisherApplication } from '@/lib/supabase/queries/application-responses'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { changePetStatus, type PetStatusDone, type PetStatusView } from './pet-status'
import type { ActionResult } from './result'

// Lo que el publicador hace con una solicitud (contracts/routes.md). Ninguna confía en el cliente:
// la sesión se vuelve a leer —con la puerta de la suspendida— y la base vuelve a controlar dueño y
// estado con el candado de la solicitud (research R5).

const FAILED = 'inbox.errors.failed'
const ID = z.uuid()

function revalidateBoth(id: string, petId: string | null) {
  revalidatePath(INBOX_PATH)
  revalidatePath(publisherApplicationPath(id))
  if (petId !== null) revalidatePath(petInboxPath(petId))
  revalidatePath(MY_APPLICATIONS_PATH)
  revalidatePath(myApplicationPath(id))
}

/** Aceptar (FR-010 a FR-012). Ya aceptada cuenta como hecha; lo demás dice cómo está ahora. */
export async function acceptApplication(input: unknown): Promise<AcceptResult> {
  const parsed = ID.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const id = parsed.data
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: FAILED }

  const record = await acceptApplicationRecord(user.id, id)
  if (record?.outcome === 'accepted' && record.sentAt !== null) {
    await trackAll(
      applicationAcceptedEvents(
        { firstResponse: record.firstResponse, sentAt: new Date(record.sentAt) },
        new Date(),
      ),
    )
  }
  if (record !== null && record.outcome !== 'not_found') {
    await drainApplicationNotices()
    const application = await getPublisherApplication(id).catch(() => null)
    revalidateBoth(id, application?.pet?.id ?? null)
  }
  return acceptOutcome(record, id)
}

/**
 * «Marcar en proceso» desde la oferta que sigue a aceptar (FR-017): el mismo cambio que en Mis
 * animales, sobre el animal de esa solicitud. Si el animal cambió mientras tanto, no cambia nada y
 * dice cómo está.
 */
export async function markInProcessFromOffer(
  input: unknown,
): Promise<ActionResult<PetStatusDone, PetStatusView>> {
  const parsed = ID.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'pets.status.errors.failed' }
  const application = await getPublisherApplication(parsed.data).catch(() => null)
  if (application?.pet === null || application === null) {
    return { ok: false, error: 'pets.status.errors.not_found' }
  }
  const result = await changePetStatus({ petId: application.pet.id, action: 'mark_in_process' })
  // «Ya estaba» también vuelve bien, y no es una marca hecha desde la oferta.
  if (result.ok && application.pet.state === 'available') {
    await trackAll([inProcessFromOfferEvent()])
    revalidatePath(publisherApplicationPath(application.id))
  }
  return result
}
