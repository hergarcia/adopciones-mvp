import { SEXES, type Sex } from '@/lib/pets/options'
import { PET_REVIEW_PAGE } from '@/lib/pets/rules'
import { PET_REVIEW_KINDS, type PetReviewKind, type PetReviewQueue } from '@/lib/pets/review-types'
import { PET_STATES, type TakedownReason } from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { oneOf } from './pet-rows'
import { petSheetOf } from './pet-sheet-rows'

// La revisión de quien administra (historia #59, research R8). La lista y su cuenta se leen con la
// sesión: la base pregunta en cada lectura si administra, y las policies de Storage firman las
// fotos solo mientras la publicación espera. Resolver va con permisos de servicio y quien
// administra como parámetro, como `resolve_identity_request`.

/** Las 20 que más esperan, de la más vieja a la más nueva; vacía para quien no administra. */
export async function listPetReviewQueue(now = new Date()): Promise<PetReviewQueue> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('pet_review_queue', { p_limit: PET_REVIEW_PAGE })
  if (error) throw new Error('No se pudo traer la lista de publicaciones', { cause: error })

  const items = await Promise.all(
    data.map(async (row) => ({
      id: row.pet_id,
      code: row.code,
      state: oneOf(PET_STATES, row.state, 'estado'),
      pendingKind: oneOf(PET_REVIEW_KINDS, row.pending_kind, 'revisión'),
      pendingSince: row.pending_since,
      isOwn: row.is_own,
      publisherPublicId: row.publisher_public_id,
      ...(await petSheetOf(row, now)),
    })),
  )
  return { items, waiting: data[0]?.others ?? 0, signedAt: now.toISOString() }
}

export type PetReviewDecision =
  | {
      decision: 'reviewed' | 'taken_down'
      ownerId: string
      petId: string
      name: string
      sex: Sex
      code: string
      kind: PetReviewKind
      pendingSince: Date
    }
  | { decision: 'closed' | 'own' | 'not_admin' | 'gone' }

const REFUSALS = ['closed', 'own', 'not_admin', 'gone'] as const

export async function resolvePetReviewRecord(input: {
  adminId: string
  petId: string
  knownSince: string
  outcome: 'reviewed' | 'taken_down'
  reason: TakedownReason | null
  note: string | null
}): Promise<PetReviewDecision> {
  const { data, error } = await createServiceSupabase().rpc('resolve_pet_review', {
    p_admin: input.adminId,
    p_pet: input.petId,
    p_known_since: input.knownSince,
    p_outcome: input.outcome,
    ...(input.reason === null ? {} : { p_reason: input.reason }),
    ...(input.note === null ? {} : { p_note: input.note }),
  })
  const row = data?.[0]
  if (error || row === undefined) throw new Error('No se pudo resolver', { cause: error })

  const refusal = REFUSALS.find((decision) => decision === row.decision)
  if (refusal !== undefined) return { decision: refusal }
  return {
    decision: input.outcome,
    ownerId: row.owner_id,
    petId: input.petId,
    name: row.pet_name,
    sex: oneOf(SEXES, row.sex, 'sexo'),
    code: row.code,
    kind: oneOf(PET_REVIEW_KINDS, row.kind, 'revisión'),
    pendingSince: new Date(row.pending_since),
  }
}
