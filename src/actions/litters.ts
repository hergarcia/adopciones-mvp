'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { deletionReasonEvent } from '@/lib/analytics/deletion-reason-events'
import { publicationOrdinal } from '@/lib/analytics/pet-events'
import { track, trackAll } from '@/lib/analytics/track'
import { checkVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { formText } from '@/lib/forms/form-data'
import { litterFormValues } from '@/lib/litters/form-data'
import { PUBLISH_LITTER_PATH, litterEditPath, litterPath } from '@/lib/litters/paths'
import { trackApplicationClosures } from '@/lib/applications/track-closures'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import { resolveAgeOnSave, uruguayDay } from '@/lib/pets/age'
import type { DeletionAnswer } from '@/lib/pets/deletion-reason'
import { normalizePetName } from '@/lib/pets/duplicate-name'
import { ageFromForm, photoIdsFrom } from '@/lib/pets/form-data'
import { LISTING_PATH, MY_PETS_PATH, petGatePath, petGateRequest } from '@/lib/pets/paths'
import { secondsSince } from '@/lib/pets/publish-seconds'
import { deletionAnswerSchema } from '@/lib/schemas/deletion-reason'
import { litterContactRejections, validateLitter, type LitterErrors } from '@/lib/schemas/litter'
import { deletePetPhotos, purgePetPhotos } from '@/lib/supabase/queries/pet-photos'
import {
  countRemovalApplications,
  deleteLitterRecord,
  getMyLitterStored,
  isLitterAttemptPublished,
  listMyLitterNames,
  publishLitterRecord,
  saveLitterRecord,
} from '@/lib/supabase/queries/litters'
import { countMyPublications, isUuid } from '@/lib/supabase/queries/pets'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { failed, type ActionResult } from './result'

export type LitterActionDetail = {
  /** Adónde lleva «Verificar»: el aviso con la vuelta a esta pantalla. */
  gatePath?: string
  litter?: LitterErrors
}

const SESSION = 'pets.errors.session'
const SAVE_FAILED = 'pets.errors.save_failed'
const NEEDS_VERIFICATION = 'pets.errors.needs_verification'

// Como publicar un animal (FR-002, FR-016): un intento ya publicado gana sobre todo, después el
// nivel, los campos y la base, que vuelve a mirar el nivel, las fotos y el intento con el candado.
// El nombre repetido se avisa antes, desde el formulario (`findLitterDuplicate`).
export async function publishLitter(
  form: FormData,
): Promise<ActionResult<{ code: string; already: boolean }, LitterActionDetail>> {
  after(purgePetPhotos)
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const attemptId = formText(form, 'attemptId')
  const { values, young } = litterFormValues(form)
  if (!isUuid(attemptId) || !young.every((one) => isUuid(one.key))) {
    return { ok: false, error: SAVE_FAILED }
  }
  const gatePath = petGatePath(PUBLISH_LITTER_PATH)

  try {
    if (await isLitterAttemptPublished(attemptId)) {
      return { ok: true, data: { code: '', already: true } }
    }
    if (!(await checkVerifiedPhone(petGateRequest(PUBLISH_LITTER_PATH))).ok) {
      return { ok: false, error: NEEDS_VERIFICATION, detail: { gatePath } }
    }
    const today = uruguayDay(new Date())
    const checked = validateLitter(values, {
      publishing: true,
      today,
      storedDeliversFrom: null,
      ageUnchanged: false,
    })
    if (!checked.ok) {
      await Promise.all(
        litterContactRejections(checked.errors).map((rejected) =>
          track('pet_contact_rejected', rejected),
        ),
      )
      return { ok: false, error: 'pets.errors.invalid', detail: { litter: checked.errors } }
    }

    const photoIds = photoIdsFrom(form)
    const saved = await publishLitterRecord({
      ownerId: user.id,
      attemptId,
      litter: checked.data,
      ageAsOf: today,
      photoIds,
      young: checked.data.young.map((one, index) => ({
        ...one,
        photoIds: young[index]?.photoIds ?? [],
      })),
    })
    if (!saved.ok) {
      const detail = saved.error === NEEDS_VERIFICATION ? { gatePath } : undefined
      return { ...(await failed(saved.error, 'publish_litter')), detail }
    }
    if (!saved.already) {
      await track('pet_published', {
        photos: photoIds.length + young.reduce((sum, one) => sum + one.photoIds.length, 0),
        seconds: secondsSince(formText(form, 'startedAt'), Date.now()),
        ordinal: publicationOrdinal(await countMyPublications()),
        litter: true,
        young: young.length,
        required_level: checked.data.requiredLevel,
      })
      revalidatePath(MY_PETS_PATH)
    }
    return { ok: true, data: { code: saved.code, already: saved.already } }
  } catch (cause) {
    return failed(SAVE_FAILED, 'publish_litter', cause)
  }
}

// El aviso de nombre repetido, antes de publicar: solo contra las camadas propias de esa especie,
// y con la forma de comparar nombres de un animal (FR-015).
export async function findLitterDuplicate(
  name: string,
  species: string,
): Promise<ActionResult<{ duplicate: boolean }>> {
  if ((await getSessionUser()) === null) return { ok: false, error: SESSION }
  try {
    const wanted = normalizePetName(name)
    const names = await listMyLitterNames(species)
    return { ok: true, data: { duplicate: names.some((one) => normalizePetName(one) === wanted) } }
  } catch (cause) {
    return failed(SAVE_FAILED, 'find_litter_duplicate', cause)
  }
}

// Al recuperar lo escrito: si su intento ya publicó, no se ofrece como sin publicar.
export async function checkLitterAttempt(
  attemptId: string,
): Promise<ActionResult<{ published: boolean }>> {
  if ((await getSessionUser()) === null) return { ok: false, error: SESSION }
  try {
    return { ok: true, data: { published: await isLitterAttemptPublished(attemptId) } }
  } catch (cause) {
    return failed(SAVE_FAILED, 'check_litter_attempt', cause)
  }
}

// Como guardar un animal (FR-002, FR-018): la puerta de nivel 1 con la vuelta a esta edición, la
// edad sin tocar que sigue avanzando desde la de antes y la fecha guardada que no traba (FR-013).
// Las crías quitadas cierran sus solicitudes en la base; acá se miden y se avisan, como al borrar.
export async function saveLitter(
  form: FormData,
): Promise<ActionResult<{ code: string }, LitterActionDetail>> {
  after(purgePetPhotos)
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const litterId = formText(form, 'litterId')
  const { values, young } = litterFormValues(form)
  if (!young.every((one) => isUuid(one.key) && (one.id === undefined || isUuid(one.id)))) {
    return { ok: false, error: SAVE_FAILED }
  }
  const path = litterEditPath(litterId)
  const gatePath = petGatePath(path)

  try {
    const owned = await getMyLitterStored(litterId)
    if (owned === null) return { ok: false, error: 'pets.errors.not_found' }
    if (!(await checkVerifiedPhone(petGateRequest(path))).ok) {
      return { ok: false, error: NEEDS_VERIFICATION, detail: { gatePath } }
    }
    const today = uruguayDay(new Date())
    const age = resolveAgeOnSave({
      base: ageFromForm(form, 'ageBase'),
      shown: ageFromForm(form, 'ageShown'),
      submitted: { value: values.ageValue, unit: values.ageUnit },
      stored: owned.stored,
      publishedOn: owned.publishedOn,
      today,
    })
    const checked = validateLitter(values, {
      publishing: false,
      today,
      storedDeliversFrom: owned.deliversFrom,
      ageUnchanged: age.unchanged,
    })
    if (!checked.ok) {
      await Promise.all(
        litterContactRejections(checked.errors).map((rejected) =>
          track('pet_contact_rejected', rejected),
        ),
      )
      return { ok: false, error: 'pets.errors.invalid', detail: { litter: checked.errors } }
    }

    const since = new Date()
    const saved = await saveLitterRecord({
      ownerId: user.id,
      litterId,
      litter: age.unchanged ? { ...checked.data, age: age.age } : checked.data,
      ageAsOf: age.unchanged ? age.age.asOf : today,
      photoIds: photoIdsFrom(form),
      young: checked.data.young.map((one, index) => ({
        ...one,
        id: young[index]?.id,
        photoIds: young[index]?.photoIds ?? [],
      })),
    })
    if (!saved.ok) {
      const detail = saved.error === NEEDS_VERIFICATION ? { gatePath } : undefined
      return { ...(await failed(saved.error, 'save_litter')), detail }
    }
    // Una foto sacada deja de existir al guardar; si borrarla falla, queda para la purga.
    await deletePetPhotos(saved.released.map((id) => ({ id, ownerId: user.id })))
    await track('pet_edited', {
      litter: true,
      young: young.length,
      required_level: checked.data.requiredLevel,
    })
    await closedYoungApplications(since, user.id)
    revalidateLitter(saved.code)
    return { ok: true, data: { code: saved.code } }
  } catch (cause) {
    return failed(SAVE_FAILED, 'save_litter', cause)
  }
}

// Antes de guardar, cuántas solicitudes se cierran con las crías que se quitan (FR-019).
export async function previewLitterRemoval(
  litterId: string,
  youngIds: string[],
): Promise<ActionResult<{ openApplications: number }>> {
  if ((await getSessionUser()) === null) return { ok: false, error: SESSION }
  if (!isUuid(litterId) || !youngIds.every(isUuid)) return { ok: false, error: SAVE_FAILED }
  try {
    return {
      ok: true,
      data: { openApplications: await countRemovalApplications(litterId, youngIds) },
    }
  } catch (cause) {
    return failed(SAVE_FAILED, 'preview_litter_removal', cause)
  }
}

// Borrar la camada entera, desde «Mis animales», su panel o al quitar la última cría al editar
// (FR-020 de la #205). Sin nivel 1: sacar de la vista algo que ya no está nunca se traba (FR-004 de la
// #206). Una que ya no existe terminó igual. Quienes pidieron una cría se enteran como al borrar un
// animal (FR-034). `reason` llega solo desde la confirmación de borrar la camada (historia #263):
// quitar la última cría no pregunta.
export async function deleteLitter(
  litterId: string,
  reason?: DeletionAnswer,
): Promise<ActionResult<null, LitterActionDetail>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }
  const answer = deletionAnswerSchema.safeParse(reason)
  if (!isUuid(litterId) || !answer.success) return { ok: false, error: SAVE_FAILED }
  try {
    const since = new Date()
    const record = await deleteLitterRecord(user.id, litterId, answer.data ?? null)
    if (record.outcome === 'not_found') return { ok: true, data: null }
    if (record.reasonCounted) {
      await trackAll([deletionReasonEvent('litter', answer.data ?? 'unanswered')])
    }
    await deletePetPhotos(record.released.map((id) => ({ id, ownerId: user.id })))
    await closedYoungApplications(since, user.id)
    revalidateLitter(record.code)
    return { ok: true, data: null }
  } catch (cause) {
    return failed(SAVE_FAILED, 'delete_litter', cause)
  }
}

// Las solicitudes de las crías quitadas las cerró un trigger: se miden y se mandan sus avisos, como
// al borrar un animal.
async function closedYoungApplications(since: Date, userId: string) {
  await trackApplicationClosures(since, { userId })
  await drainApplicationNotices()
}

function revalidateLitter(code: string) {
  revalidatePath(MY_PETS_PATH)
  revalidatePath(LISTING_PATH)
  revalidatePath(litterPath(code))
}
