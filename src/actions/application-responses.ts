'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  acceptanceRevokedEvent,
  applicationAcceptedEvents,
  applicationRejectedEvents,
  inProcessFromOfferEvent,
  questionAskedEvents,
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
  askOutcome,
  rejectOutcome,
  type AcceptResult,
  type AskResult,
  type RejectResult,
} from '@/lib/applications/response-outcome'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import {
  acceptApplicationRecord,
  askQuestionRecord,
  rejectApplicationRecord,
  revokeAcceptanceRecord,
  type RejectRecord,
} from '@/lib/supabase/queries/application-response-records'
import {
  questionSchema,
  rejectionSchema,
  revocationSchema,
} from '@/lib/schemas/application-response'
import { getPublisherApplication } from '@/lib/supabase/queries/application-responses'
import { getApplicationMeasure } from '@/lib/supabase/queries/measured-levels'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { changeYoungStatus } from './litter-status'
import { changePetStatus, type PetStatusDone, type PetStatusView } from './pet-status'
import { failed, type ActionResult } from './result'

// Lo que el publicador hace con una solicitud (contracts/routes.md). Ninguna confía en el cliente:
// la sesión se vuelve a leer —con la puerta de la suspendida— y la base vuelve a controlar dueño y
// estado con el candado de la solicitud (research R5).
//
// Lo que se mide lleva la medida de quien solicitó, leída recién cuando la respuesta quedó hecha y
// solo si se va a medir: es la de ahora y un doble toque no lee nada (historia #236, R1). Si no se
// puede leer, el momento sale sin ella y la acción devuelve lo mismo.

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
  if (record === null) return failed(FAILED, 'accept_application')
  if (record?.outcome === 'accepted' && record.sentAt !== null) {
    await trackAll(
      applicationAcceptedEvents(
        {
          firstResponse: record.firstResponse,
          sentAt: new Date(record.sentAt),
          inLitter: record.inLitter,
          applicant: await applicantNow(id),
        },
        new Date(),
      ),
    )
  }
  await settle(id, record)
  return acceptOutcome(record, id)
}

async function applicantNow(id: string) {
  return (await getApplicationMeasure(id))?.applicant ?? null
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
  if (record === null) return failed(FAILED, 'reject_application')
  if (rejectedNow(record)) {
    await trackAll(
      applicationRejectedEvents(
        {
          reason: parsed.data.reason,
          firstResponse: record.firstResponse,
          sentAt: new Date(record.sentAt),
          applicant: await applicantNow(parsed.data.id),
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
  if (record === null) return failed(FAILED, 'revoke_acceptance')
  if (rejectedNow(record)) {
    const applicant = await applicantNow(parsed.data.id)
    await trackAll([acceptanceRevokedEvent(parsed.data.reason, applicant)])
  }
  await settle(parsed.data.id, record)
  return rejectOutcome(record)
}

/** Pedir más información (FR-030, FR-031). El mismo intento dos veces cuenta como hecho. */
export async function askQuestion(input: unknown): Promise<AskResult> {
  const parsed = questionSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: FAILED }

  const record = await askQuestionRecord(user.id, parsed.data)
  if (record === null) return failed(FAILED, 'ask_question')
  if (record?.outcome === 'asked' && record.sentAt !== null) {
    await trackAll(
      questionAskedEvents(
        {
          firstResponse: record.firstResponse,
          sentAt: new Date(record.sentAt),
          applicant: await applicantNow(parsed.data.id),
        },
        new Date(),
      ),
    )
  }
  await settle(parsed.data.id, record)
  return askOutcome(record)
}

// Una cría tiene su propia acción (historia #206, R4): `change_pet_status` la rechaza. Se prueba
// primero como cría; si no lo es, como animal. Sus errores vuelven con las claves de un animal, que
// son las que conoce la oferta.
async function markPetInProcess(
  petId: string,
): Promise<ActionResult<PetStatusDone, PetStatusView>> {
  const young = await changeYoungStatus({ petId, action: 'mark_in_process' })
  if (young.ok)
    return {
      ok: true,
      data: { state: young.data.state, expiresAt: null, notice: young.data.notice },
    }
  if (young.error === 'litters.status.errors.not_found') {
    return changePetStatus({ petId, action: 'mark_in_process' })
  }
  return {
    ok: false,
    error: young.error.replace('litters.status.', 'pets.status.'),
    ...(young.detail === undefined
      ? {}
      : { detail: { state: young.detail.state, expiresAt: null } }),
  }
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
  const result = await markPetInProcess(application.pet.id)
  // «Ya estaba» también vuelve bien, y no es una marca hecha desde la oferta.
  if (result.ok && application.pet.state === 'available') {
    await trackAll([inProcessFromOfferEvent()])
    revalidatePath(publisherApplicationPath(application.id))
  }
  return result
}
