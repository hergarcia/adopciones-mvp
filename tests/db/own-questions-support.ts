// Lo que comparten las pruebas de la pregunta propia (historia #292): una rescatista con un animal
// sin pregunta, Kira con la suya y una camada con la suya y dos crías; dos solicitantes con el
// teléfono verificado; quien administra; y las tablas leídas con el servicio.
import { expect } from 'vitest'
import type { Json } from '../../src/lib/supabase/types'
import { ANSWERS, PENDING_TTL, applicationPeople, petOf } from './applications-support'
import {
  litterWithYoung,
  publishLitter,
  saveLitter,
  savedYoungOf,
  youngList,
  youngOf,
} from './litter-support'
import { FIELDS, STAGED_TTL, stagedPhotos } from './pet-support'
import { db, firstRow, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'

export type Submitted = Functions['submit_application']['Returns'][number]

export const KIRA_QUESTION = 'Kira toma una pastilla dos veces por día. ¿Podés dársela en horario?'
export const LITTER_QUESTION = '¿Te comprometés a traerlo a la vacuna de los 3 meses?'
export const KIRA_ANSWER = 'Sí, a las 8 y a las 20: trabajo desde casa.'

export function ownQuestionPeople(cleanups: SyntheticUser['cleanup'][]) {
  const people = applicationPeople(cleanups)
  return {
    ...people,
    /** Carla, con Pipo sin pregunta, Kira con la suya y una camada con la suya y dos crías. */
    rescuer: async () => {
      const publisher = await people.person(1, 'Carla')
      const pipo = await petOf(publisher, { name: 'Pipo' })
      const kira = await petOf(publisher, { name: 'Kira' })
      await setPetQuestion(kira.petId, KIRA_QUESTION)
      const litter = await litterWithYoung(publisher.id, 2)
      await setLitterQuestion(litter.litterId, LITTER_QUESTION)
      return { publisher, pipo, kira, litter }
    },
    /** Dos personas con el teléfono verificado. */
    applicants: async () => ({
      lucia: await people.person(1, 'Lucía'),
      bruno: await people.person(1, 'Bruno'),
    }),
  }
}

/** Cambiar la pregunta de un animal directo con el servicio; null la saca. */
export async function setPetQuestion(petId: string, question: string | null) {
  const { error } = await db().from('pets').update({ own_question: question }).eq('id', petId)
  expect(error).toBeNull()
}

export async function setLitterQuestion(litterId: string, question: string | null) {
  const { error } = await db().from('litters').update({ own_question: question }).eq('id', litterId)
  expect(error).toBeNull()
}

export async function petQuestionOf(petId: string): Promise<string | null> {
  const { data, error } = await db().from('pets').select('own_question').eq('id', petId).single()
  expect(error).toBeNull()
  return data?.own_question ?? null
}

/** Mandar como la aplicación, con la pregunta que la persona tenía en pantalla y su respuesta. */
export async function submitOwn(
  applicant: { id: string },
  code: string,
  options: {
    ownQuestion?: string
    ownAnswer?: string
    attempt?: string
    answers?: Json
  } = {},
): Promise<Submitted> {
  const { data, error } = await db().rpc('submit_application', {
    p_applicant: applicant.id,
    p_attempt: options.attempt ?? crypto.randomUUID(),
    p_code: code,
    p_answers: options.answers ?? ANSWERS,
    p_pending_ttl: PENDING_TTL,
    ...(options.ownQuestion === undefined ? {} : { p_own_question: options.ownQuestion }),
    ...(options.ownAnswer === undefined ? {} : { p_own_answer: options.ownAnswer }),
  })
  expect(error).toBeNull()
  return firstRow(data, 'submit_application')
}

/** La pregunta y la respuesta guardadas en las solicitudes de una persona, con el servicio. */
export async function ownColumnsOf(applicantId: string) {
  const { data, error } = await db()
    .from('applications')
    .select('own_question, own_answer')
    .eq('applicant_id', applicantId)
    .order('sent_at')
  expect(error).toBeNull()
  return data ?? []
}

const fields = (ownQuestion: string | undefined) => ({
  ...FIELDS,
  ...(ownQuestion === undefined ? {} : { own_question: ownQuestion }),
})

/** Publicar como la aplicación, con la pregunta en `p_fields`. */
export async function publishWithQuestion(
  ownerId: string,
  ownQuestion: string | undefined,
  attempt: string = crypto.randomUUID(),
  photoIds?: string[],
) {
  const { data, error } = await db().rpc('publish_pet', {
    p_owner: ownerId,
    p_attempt: attempt,
    p_pending_ttl: PENDING_TTL,
    p_staged_ttl: STAGED_TTL,
    p_fields: fields(ownQuestion),
    p_photo_ids: photoIds ?? (await stagedPhotos(ownerId, 1)),
  })
  expect(error).toBeNull()
  return firstRow(data, 'publish_pet')
}

/** Guardar la edición como la aplicación, con las fotos que ya tiene. */
export async function saveWithQuestion(
  ownerId: string,
  petId: string,
  ownQuestion: string | undefined,
) {
  const photos = await db().from('pet_photos').select('id').eq('pet_id', petId).order('position')
  expect(photos.error).toBeNull()
  return db().rpc('save_pet', {
    p_owner: ownerId,
    p_pet: petId,
    p_pending_ttl: PENDING_TTL,
    p_staged_ttl: STAGED_TTL,
    p_fields: fields(ownQuestion),
    p_photo_ids: (photos.data ?? []).map((photo) => photo.id),
  })
}

export async function litterQuestionOf(litterId: string): Promise<string | null> {
  const { data, error } = await db()
    .from('litters')
    .select('own_question')
    .eq('id', litterId)
    .single()
  expect(error).toBeNull()
  return data?.own_question ?? null
}

/** Publicar una camada de dos crías como la aplicación, con la pregunta en `p_fields`. */
export async function publishLitterWithQuestion(ownerId: string, ownQuestion: string | null) {
  const photoIds = await stagedPhotos(ownerId, 1)
  const { row, error } = await publishLitter(ownerId, photoIds, youngList(2), {
    fields: { own_question: ownQuestion },
  })
  expect(error).toBeNull()
  const litter = firstRow(row ? [row] : [], 'publish_litter')
  return { litterId: litter.litter_id, photoIds }
}

/**
 * Guardar la edición de la camada como la aplicación, con sus crías y, si se pide, una nueva al
 * final. Devuelve las crías como quedaron.
 */
export async function saveLitterWithQuestion(
  ownerId: string,
  litter: { litterId: string; photoIds: string[] },
  ownQuestion: string | null,
  options: { addYoung?: string } = {},
) {
  const young = await savedYoungOf(litter.litterId)
  const added = options.addYoung === undefined ? [] : youngList(1, [{ name: options.addYoung }])
  const { error } = await saveLitter(
    ownerId,
    litter.litterId,
    litter.photoIds,
    [...young, ...added],
    { own_question: ownQuestion },
  )
  expect(error).toBeNull()
  return youngOf(litter.litterId)
}
