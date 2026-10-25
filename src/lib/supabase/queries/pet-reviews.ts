import { z } from 'zod'
import { SEXES, type Sex } from '@/lib/pets/options'
import { PET_REVIEW_PAGE } from '@/lib/pets/rules'
import {
  PET_REVIEW_KINDS,
  type PetReviewKind,
  type PetReviewQueue,
  type ReviewItem,
  type ReviewTarget,
  type YoungInReview,
} from '@/lib/pets/review-types'
import { PET_STATES, type TakedownReason } from '@/lib/pets/types'
import type { Database } from '@/lib/supabase/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { signPetPhotos } from './pet-photos'
import { isPhotoJson, oneOf } from './pet-rows'
import { petSheetOf, traitsSheetOf } from './pet-sheet-rows'

// La revisión de quien administra (historia #59, research R8). La lista y su cuenta se leen con la
// sesión: la base pregunta en cada lectura si administra, y las policies de Storage firman las
// fotos solo mientras la publicación espera. Resolver va con permisos de servicio y quien
// administra como parámetro, como `resolve_identity_request`.

type QueueRow = Database['public']['Functions']['pet_review_queue']['Returns'][number]

const YOUNG_JSON = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    sex: z.enum(SEXES),
    description: z.string().nullable(),
    photos: z.array(z.unknown()),
  }),
)

// Cada cría con sus fotos propias firmadas: quien revisa ve lo que subió para cada una (FR-043).
async function youngInReview(value: unknown, ownerFolder: string): Promise<YoungInReview[]> {
  const young = YOUNG_JSON.parse(value)
  const own = young.map((one) => one.photos.filter(isPhotoJson))
  const signed = await signPetPhotos(
    own.flat().map((photo) => ({ ...photo, ownerId: ownerFolder })),
  )
  return young.map((one, index) => ({
    id: one.id,
    name: one.name,
    sex: one.sex,
    description: one.description,
    photos: (own[index] ?? []).flatMap((photo) => signed.get(photo.id) ?? []),
  }))
}

async function itemOf(row: QueueRow, now: Date): Promise<ReviewItem> {
  const common = {
    code: row.code,
    pendingKind: oneOf(PET_REVIEW_KINDS, row.pending_kind, 'revisión'),
    pendingSince: row.pending_since,
    isOwn: row.is_own,
    publisherPublicId: row.publisher_public_id,
  }
  if (row.kind === 'litter') {
    const [traits, young] = await Promise.all([
      traitsSheetOf(row, now),
      youngInReview(row.young, row.owner_folder),
    ])
    return { kind: 'litter', id: row.litter_id, ...common, ...traits, young }
  }
  return {
    kind: 'pet',
    id: row.pet_id,
    state: oneOf(PET_STATES, row.state, 'estado'),
    ...common,
    ...(await petSheetOf(row, now)),
  }
}

/** Las 20 que más esperan, de la más vieja a la más nueva; vacía para quien no administra. */
export async function listPetReviewQueue(now = new Date()): Promise<PetReviewQueue> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('pet_review_queue', { p_limit: PET_REVIEW_PAGE })
  if (error) throw new Error('No se pudo traer la lista de publicaciones', { cause: error })

  const items = await Promise.all(data.map((row) => itemOf(row, now)))
  return { items, waiting: data[0]?.others ?? 0, signedAt: now.toISOString() }
}

/** Lo resuelto: un animal con su sexo, o una camada, que no tiene. */
export type ResolvedSubject = { kind: 'pet'; petId: string; sex: Sex } | { kind: 'litter' }

export type PetReviewDecision =
  | {
      decision: 'reviewed' | 'taken_down'
      ownerId: string
      subject: ResolvedSubject
      name: string
      code: string
      kind: PetReviewKind
      pendingSince: Date
    }
  | { decision: 'closed' | 'own' | 'not_admin' | 'gone' }

const REFUSALS = ['closed', 'own', 'not_admin', 'gone'] as const

type ResolveInput = {
  adminId: string
  target: ReviewTarget
  knownSince: string
  outcome: 'reviewed' | 'taken_down'
  reason: TakedownReason | null
  note: string | null
}

type ResolvedRow = {
  decision: string
  owner_id: string
  name: string
  code: string
  kind: string
  pending_since: string
  /** Null en una camada: lo tiene cada cría. */
  sex: string | null
}

async function resolveRow(input: ResolveInput): Promise<ResolvedRow> {
  const service = createServiceSupabase()
  const decision = {
    p_admin: input.adminId,
    p_known_since: input.knownSince,
    p_outcome: input.outcome,
    ...(input.reason === null ? {} : { p_reason: input.reason }),
    ...(input.note === null ? {} : { p_note: input.note }),
  }
  const { data, error } =
    input.target.kind === 'litter'
      ? await service.rpc('resolve_litter_review', { ...decision, p_litter: input.target.id })
      : await service.rpc('resolve_pet_review', { ...decision, p_pet: input.target.id })
  const row = data?.[0]
  if (error || row === undefined) throw new Error('No se pudo resolver', { cause: error })
  return 'litter_name' in row
    ? { ...row, name: row.litter_name, sex: null }
    : { ...row, name: row.pet_name }
}

export async function resolvePetReviewRecord(input: ResolveInput): Promise<PetReviewDecision> {
  const row = await resolveRow(input)
  const refusal = REFUSALS.find((decision) => decision === row.decision)
  if (refusal !== undefined) return { decision: refusal }
  return {
    decision: input.outcome,
    ownerId: row.owner_id,
    subject:
      row.sex === null
        ? { kind: 'litter' }
        : { kind: 'pet', petId: input.target.id, sex: oneOf(SEXES, row.sex, 'sexo') },
    name: row.name,
    code: row.code,
    kind: oneOf(PET_REVIEW_KINDS, row.kind, 'revisión'),
    pendingSince: new Date(row.pending_since),
  }
}
