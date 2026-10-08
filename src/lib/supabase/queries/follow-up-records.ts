import {
  FOLLOW_UP_OUTCOMES,
  STAGE_OUTCOMES,
  type FollowUpOutcome,
  type StageOutcome,
} from '@/lib/follow-ups/types'
import { SEXES } from '@/lib/pets/options'
import type { PreparedPhotoFiles } from '@/lib/pets/prepared-photo-files'
import { createServiceSupabase } from '@/lib/supabase/service'
import { FOLLOW_UP_PHOTOS_BUCKET } from './follow-ups'
import { objectPath, objectPaths, removeBucketObjects, uploadBucketPhotoFiles } from './pet-photos'
import { oneOf } from './pet-rows'

// Lo que escribe el seguimiento (historia #69, research R6 a R8): con el servicio y el id que sale de
// la sesión; la base decide si corresponde con el candado.

/** Anota una foto en espera como quien adoptó (research R6); null si la base no respondió. */
export async function stageFollowUpPhoto(input: {
  adopterId: string
  applicationId: string
  photoId: string
  width: number
  height: number
  thumbhash: string
}): Promise<{ outcome: StageOutcome; followUpId: string | null } | null> {
  const { data, error } = await createServiceSupabase().rpc('stage_follow_up_photo', {
    p_adopter: input.adopterId,
    p_application: input.applicationId,
    p_photo: input.photoId,
    p_width: input.width,
    p_height: input.height,
    p_thumbhash: input.thumbhash,
  })
  const row = error ? undefined : data[0]
  const outcome = STAGE_OUTCOMES.find((candidate) => candidate === row?.outcome)
  if (row === undefined || outcome === undefined) return null
  return { outcome, followUpId: row.follow_up_id ?? null }
}

// Sube el servicio y no la sesión: el bucket no tiene políticas, así no hay objetos sin fila.
export function uploadFollowUpPhotoFiles(
  followUpId: string,
  photoId: string,
  files: PreparedPhotoFiles,
): Promise<{ ok: boolean }> {
  return uploadBucketPhotoFiles(FOLLOW_UP_PHOTOS_BUCKET, followUpId, photoId, files)
}

export async function followUpPhotoRowExists(photoId: string): Promise<boolean> {
  const { data } = await createServiceSupabase()
    .from('follow_up_photos')
    .select('id')
    .eq('id', photoId)
    .maybeSingle()
  return data !== null
}

export type AnswerRecord = {
  outcome: FollowUpOutcome
  requestedAt: Date | null
  photoCount: number
  hasText: boolean
}

/** «Mandar» como quien adoptó (research R6); null si la base no respondió. */
export async function answerFollowUp(
  adopterId: string,
  input: { applicationId: string; photoIds: string[]; text: string | null },
): Promise<AnswerRecord | null> {
  const { data, error } = await createServiceSupabase().rpc('answer_follow_up', {
    p_adopter: adopterId,
    p_application: input.applicationId,
    p_photos: input.photoIds,
    p_text: input.text ?? '',
  })
  const row = error ? undefined : data[0]
  const outcome = FOLLOW_UP_OUTCOMES.find((candidate) => candidate === row?.outcome)
  if (row === undefined || outcome === undefined) return null
  const requested: string | null = row.requested_at ?? null
  return {
    outcome,
    requestedAt: requested === null ? null : new Date(requested),
    photoCount: row.photo_count,
    hasText: row.has_text,
  }
}

/**
 * Anota que quien lo dio vio la respuesta (research R11): el día en que llegó si es la primera vez,
 * null si ya la había visto, si no la puede ver o si la base no respondió.
 */
export async function markFollowUpSeen(
  publisherId: string,
  applicationId: string,
): Promise<Date | null> {
  const { data, error } = await createServiceSupabase().rpc('mark_follow_up_seen', {
    p_publisher: publisherId,
    p_application: applicationId,
  })
  const row = error ? undefined : data[0]
  const answered: string | null = row?.answered_at ?? null
  return row?.first === true && answered !== null ? new Date(answered) : null
}

export type FollowUpAnsweredEmailRow = {
  adopterName: string
  petName: string
  petSex: (typeof SEXES)[number]
  petId: string | null
  followUpId: string
  firstPhotoId: string | null
}

/** Lo que lleva el correo «Ana contó cómo va Tobi» (research R8); null si no corresponde. */
export async function followUpAnsweredForEmail(
  applicationId: string,
  recipientId: string,
): Promise<FollowUpAnsweredEmailRow | null> {
  const { data, error } = await createServiceSupabase().rpc('follow_up_answered_for_email', {
    p_application: applicationId,
    p_recipient: recipientId,
  })
  const row = error ? undefined : data[0]
  if (row === undefined) return null
  const sex: string | null = row.pet_sex ?? null
  return {
    adopterName: row.adopter_name,
    petName: row.pet_name,
    petSex: sex === null ? 'male' : oneOf(SEXES, sex, 'sexo'),
    petId: row.pet_id ?? null,
    followUpId: row.follow_up_id,
    firstPhotoId: row.first_photo_id ?? null,
  }
}

/** La foto `card` de una respuesta, bajada con el servicio para el correo; null si no se pudo. */
export async function downloadFollowUpCard(
  followUpId: string,
  photoId: string,
): Promise<Buffer | null> {
  const { data, error } = await createServiceSupabase()
    .storage.from(FOLLOW_UP_PHOTOS_BUCKET)
    .download(objectPath(followUpId, photoId, 'card'))
  if (error) return null
  return Buffer.from(await data.arrayBuffer())
}

export async function deleteFollowUpPhotoObjects(followUpId: string, photoId: string) {
  return removeBucketObjects(
    FOLLOW_UP_PHOTOS_BUCKET,
    objectPaths({ id: photoId, ownerId: followUpId }),
  )
}

const PURGE_BATCH = 300

// Los objetos de las fotos que ya no tienen fila (research R7): primero Storage y después la cola,
// así un borrado que falla se reintenta en la próxima.
export async function purgeFollowUpPhotos(): Promise<void> {
  const service = createServiceSupabase()
  const { data, error } = await service.rpc('claim_follow_up_photo_purges', {
    p_limit: PURGE_BATCH,
  })
  if (error || data.length === 0) return
  const photos = data.map((row) => ({ id: row.photo_id, ownerId: row.follow_up_id }))
  if (!(await removeBucketObjects(FOLLOW_UP_PHOTOS_BUCKET, photos.flatMap(objectPaths)))) return
  await service.rpc('forget_follow_up_photo_purges', { p_items: data })
}
