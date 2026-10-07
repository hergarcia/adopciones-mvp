'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  acceptanceRevokedEvent,
  applicationAcceptedEvents,
  applicationRejectedEvents,
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
import {
  acceptOutcome,
  rejectOutcome,
  type AcceptResult,
  type RejectResult,
} from '@/lib/applications/response-outcome'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import {
  acceptApplicationRecord,
  rejectApplicationRecord,
  revokeAcceptanceRecord,
  type RejectRecord,
} from '@/lib/supabase/queries/application-response-records'
import { rejectionSchema, revocationSchema } from '@/lib/schemas/application-response'
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
  await settle(id, record)
  return acceptOutcome(record, id)
}

// Después de una respuesta que pudo cambiar algo: los correos salen ya y las dos puntas se refrescan.
async function settle(id: string, record: { outcome: string } | null) {
  if (record === null || record.outcome === 'not_found') return
  await drainApplicationNotices()
  const application = await getPublisherApplication(id).catch(() => null)
  revalidateBoth(id, application?.pet?.id ?? null)
}

// El schema dice qué falta o qué sobra en el campo; la hoja ya lo marcó, esto es por si no pasó por
// ella. El contacto cita su fragmento en el cliente: acá alcanza la clave.
function invalid(error: { issues: { message: string }[] }): RejectResult {
  return { ok: false, error: error.issues[0]?.message ?? FAILED }
}

function rejectedNow(record: RejectRecord | null): record is RejectRecord & { sentAt: string } {
  return record?.outcome === 'rejected' && record.sentAt !== null
}

/** Rechazar con un motivo (FR-020 a FR-022). Ya rechazada cuenta como hecha. */
export async function rejectApplication(input: unknown): Promise<RejectResult> {
  const parsed = rejectionSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: FAILED }

  const record = await rejectApplicationRecord(user.id, parsed.data)
  if (rejectedNow(record)) {
    await trackAll(
      applicationRejectedEvents(
        {
          reason: parsed.data.reason,
          firstResponse: record.firstResponse,
          sentAt: new Date(record.sentAt),
        },
        new Date(),
      ),
    )
  }
  await settle(parsed.data.id, record)
  return rejectOutcome(record)
}

/** Dejar sin efecto una aceptada (FR-024): queda rechazada y el contacto deja de verse. */
export async function revokeAcceptance(input: unknown): Promise<RejectResult> {
  const parsed = revocationSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: FAILED }

  const record = await revokeAcceptanceRecord(user.id, parsed.data)
  if (rejectedNow(record)) await trackAll([acceptanceRevokedEvent(parsed.data.reason)])
  await settle(parsed.data.id, record)
  return rejectOutcome(record)
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
