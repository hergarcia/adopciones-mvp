import {
  FOLLOW_UP_STATUSES,
  SKIP_REASONS,
  type FollowUpEvent,
  type FollowUpRow,
  type PetFollowUp,
  type StoredFollowUpPhoto,
} from '@/lib/follow-ups/types'
import type { PetPhotoData } from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { UUID } from './applications'
import { signBucketPhotosAsService } from './pet-photos'
import { oneOf } from './pet-rows'

// El seguimiento a los 30 días (historia #69). Lo que se lee va con la sesión, así cada función
// vuelve a preguntar quién es y lo ajeno da cero filas (research R2); lo que escribe o mide, con el
// servicio.

export const FOLLOW_UP_PHOTOS_BUCKET = 'follow-up-photos'

function photosOf(value: unknown): StoredFollowUpPhoto[] {
  if (!Array.isArray(value)) return []
  return value.map((photo: Record<string, unknown>) => ({
    id: String(photo.id),
    width: Number(photo.width),
    height: Number(photo.height),
    thumbhash: String(photo.thumbhash),
  }))
}

/** El seguimiento de una solicitud para quien mira, o null. Lanza si la base falla. */
export async function followUpOf(applicationId: string): Promise<FollowUpRow | null> {
  if (!UUID.test(applicationId)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('follow_up_of', { p_application: applicationId })
  if (error) throw new Error('No se pudo traer el seguimiento', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  return {
    followUpId: row.follow_up_id,
    side: row.side === 'publisher' ? 'publisher' : 'adopter',
    status: oneOf(FOLLOW_UP_STATUSES, row.status, 'seguimiento'),
    requestedAt: row.requested_at,
    answeredAt: row.answered_at ?? null,
    answerText: row.answer_text ?? null,
    photos: photosOf(row.photos),
    canAnswer: row.can_answer,
    hidden: row.hidden,
  }
}

/** El seguimiento de la última adopción de cada animal propio, por id; vacío si la base falló. */
export async function myPetFollowUps(): Promise<Map<string, PetFollowUp>> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('my_pet_follow_ups')
  if (error) return new Map()
  return new Map(
    data.map((row) => [
      row.pet_id,
      {
        petId: row.pet_id,
        applicationId: row.application_id ?? null,
        status: oneOf(FOLLOW_UP_STATUSES, row.status, 'seguimiento'),
        requestedAt: row.requested_at,
        answeredAt: row.answered_at ?? null,
        adoptionCurrent: row.adoption_current,
      },
    ]),
  )
}

/** Las solicitudes propias con el pedido abierto; vacío si la base falló. */
export async function myOpenFollowUps(): Promise<Set<string>> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('my_open_follow_ups')
  if (error) return new Set()
  return new Set(data.map((row) => row.application_id))
}

// Solo después de `followUpOf`, que ya decidió quién las ve: esto firma lo que ella devolvió.
export async function signFollowUpPhotos(
  followUpId: string,
  photos: StoredFollowUpPhoto[],
): Promise<PetPhotoData[]> {
  const signed = await signBucketPhotosAsService(
    FOLLOW_UP_PHOTOS_BUCKET,
    photos.map((photo) => ({ ...photo, ownerId: followUpId })),
  )
  return photos.flatMap((photo) => signed.get(photo.id) ?? [])
}

/** Marca y devuelve los pedidos y no pedidos sin medir: cada uno, una sola vez (research R11). */
export async function claimFollowUpEvents(limit: number): Promise<FollowUpEvent[]> {
  const { data, error } = await createServiceSupabase().rpc('claim_follow_up_events', {
    p_limit: limit,
  })
  if (error) throw new Error('No se pudieron tomar los seguimientos', { cause: error })
  return data.map((row) =>
    row.skip_reason === null || row.skip_reason === undefined
      ? { status: 'requested' }
      : { status: 'skipped', reason: oneOf(SKIP_REASONS, row.skip_reason, 'motivo') },
  )
}
