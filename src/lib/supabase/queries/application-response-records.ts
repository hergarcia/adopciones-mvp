import { ACCEPT_OUTCOMES, type AcceptOutcome } from '@/lib/applications/response-outcome'
import { NOTICE_KINDS, type NoticeKind } from '@/lib/applications/types'
import { SEXES, type Sex } from '@/lib/pets/options'
import { createServiceSupabase } from '@/lib/supabase/service'
import { UUID } from './applications'
import { oneOf } from './pet-rows'

// Lo que escribe el publicador sobre una solicitud y la bandeja de salida de los correos (historia
// #65): con el servicio y su id, que sale de la sesión en el servidor; la base vuelve a controlar
// dueño y estado (research R5).

/** Marcarla abierta (FR-005); nulo si no es suya o la base no respondió. */
export async function openApplicationRecord(
  publisherId: string,
  id: string,
): Promise<{ openedFirst: boolean; sentAt: string } | null> {
  if (!UUID.test(id)) return null
  const { data, error } = await createServiceSupabase().rpc('open_application', {
    p_publisher: publisherId,
    p_id: id,
  })
  const row = error ? undefined : data[0]
  if (row === undefined) return null
  return { openedFirst: row.opened_first, sentAt: row.sent_at }
}

/** Abrir Solicitudes, o las de un animal (R6). Medir no frena la pantalla: si falla, sigue. */
export async function visitInboxRecord(publisherId: string, petId?: string): Promise<void> {
  if (petId !== undefined && !UUID.test(petId)) return
  await createServiceSupabase().rpc('visit_inbox', {
    p_publisher: publisherId,
    ...(petId === undefined ? {} : { p_pet: petId }),
  })
}

export type AcceptRecord = { outcome: AcceptOutcome; firstResponse: boolean; sentAt: string | null }

/** Aceptar como el publicador; nulo si la base no respondió. */
export async function acceptApplicationRecord(
  publisherId: string,
  id: string,
): Promise<AcceptRecord | null> {
  if (!UUID.test(id)) return { outcome: 'not_found', firstResponse: false, sentAt: null }
  const { data, error } = await createServiceSupabase().rpc('accept_application', {
    p_publisher: publisherId,
    p_id: id,
  })
  const row = error ? undefined : data[0]
  const outcome = ACCEPT_OUTCOMES.find((candidate) => candidate === row?.outcome)
  if (row === undefined || outcome === undefined) return null
  return { outcome, firstResponse: row.first_response, sentAt: row.sent_at ?? null }
}

export type ClaimedNotice = {
  kind: NoticeKind
  applicationId: string
  recipientId: string
  petName: string
  petSex: Sex | null
}

/** Toma y borra hasta `limit` avisos pendientes (R3); vacío si la base no respondió. */
export async function claimApplicationNotices(limit: number): Promise<ClaimedNotice[]> {
  const { data, error } = await createServiceSupabase().rpc('claim_application_notices', {
    p_limit: limit,
  })
  if (error) return []
  return data.flatMap((row) => {
    const kind = NOTICE_KINDS.find((candidate) => candidate === row.kind)
    if (kind === undefined) return []
    const sex: string | null = row.pet_sex ?? null
    return [
      {
        kind,
        applicationId: row.application_id,
        recipientId: row.recipient_id,
        petName: row.pet_name,
        petSex: sex === null ? null : oneOf(SEXES, sex, 'sexo'),
      },
    ]
  })
}
