'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { publicationOrdinal } from '@/lib/analytics/pet-events'
import { track } from '@/lib/analytics/track'
import { checkVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { CONTACT_KINDS } from '@/lib/contact/contact-match'
import { formText } from '@/lib/forms/form-data'
import { resolveAgeOnSave, uruguayDay } from '@/lib/pets/age'
import { ageFromForm, petFormValues, photoIdsFrom } from '@/lib/pets/form-data'
import {
  MY_PETS_PATH,
  PUBLISH_PATH,
  petGatePath,
  editPetPath,
  petGateRequest,
} from '@/lib/pets/paths'
import { isOneOf } from '@/lib/pets/options'
import { publishDecision } from '@/lib/pets/publish-steps'
import { secondsSince } from '@/lib/pets/publish-seconds'
import {
  contactRejections,
  validatePet,
  type PetField,
  type PetFieldErrors,
} from '@/lib/schemas/pet'
import { deletePetPhotos, purgePetPhotos } from '@/lib/supabase/queries/pet-photos'
import { publishPetRecord, savePetRecord } from '@/lib/supabase/queries/pet-records'
import {
  countMyPublications,
  getMyPetAge,
  isAttemptPublished,
  isUuid,
  listMyPetNames,
} from '@/lib/supabase/queries/pets'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { failed, type ActionResult } from './result'

export type PetActionDetail = {
  /** Adónde lleva «Verificar»: el aviso con la vuelta a esta pantalla. */
  gatePath?: string
  fields?: PetFieldErrors
  duplicate?: { name: string; sex: 'male' | 'female'; species: string }
}

const SESSION = 'pets.errors.session'
const SAVE_FAILED = 'pets.errors.save_failed'
const NEEDS_VERIFICATION = 'pets.errors.needs_verification'

async function trackContactRejections(errors: PetFieldErrors) {
  await Promise.all(
    contactRejections(errors).map((rejected) => track('pet_contact_rejected', rejected)),
  )
}

export async function publishPet(
  form: FormData,
): Promise<ActionResult<{ already: boolean }, PetActionDetail>> {
  after(purgePetPhotos)
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const attemptId = formText(form, 'attemptId')
  if (!isUuid(attemptId)) return { ok: false, error: SAVE_FAILED }
  const gatePath = petGatePath(PUBLISH_PATH)

  try {
    const decision = await publishDecision({
      attemptId,
      confirmDuplicate: formText(form, 'confirmDuplicate') === 'true',
      validation: validatePet(petFormValues(form), { ageUnchanged: false }),
      attemptPublished: () => isAttemptPublished(attemptId),
      isLevelOne: async () => (await checkVerifiedPhone(petGateRequest(PUBLISH_PATH))).ok,
      sameSpeciesPets: listMyPetNames,
    })

    switch (decision.kind) {
      case 'already':
        return { ok: true, data: { already: true } }
      case 'needs_verification':
        return { ok: false, error: NEEDS_VERIFICATION, detail: { gatePath } }
      case 'invalid':
        await trackContactRejections(decision.errors)
        return { ok: false, error: 'pets.errors.invalid', detail: { fields: decision.errors } }
      case 'duplicate_name':
        return {
          ok: false,
          error: 'pets.errors.duplicate_name',
          detail: { duplicate: { ...decision.duplicate, species: formText(form, 'species') } },
        }
      case 'publish':
        break
    }

    const photoIds = photoIdsFrom(form)
    const saved = await publishPetRecord({
      ownerId: user.id,
      attemptId,
      pet: decision.data,
      ageAsOf: uruguayDay(new Date()),
      photoIds,
    })
    if (!saved.ok) {
      const detail = saved.error === NEEDS_VERIFICATION ? { gatePath } : undefined
      return { ...(await failed(saved.error, 'publish_pet')), detail }
    }
    if (!saved.already) {
      await track('pet_published', {
        photos: photoIds.length,
        seconds: secondsSince(formText(form, 'startedAt'), Date.now()),
        ordinal: publicationOrdinal(await countMyPublications()),
        litter: false,
      })
      revalidatePath(MY_PETS_PATH)
    }
    return { ok: true, data: { already: saved.already } }
  } catch (cause) {
    return failed(SAVE_FAILED, 'publish_pet', cause)
  }
}

// Guardar deja el animal como estaba en la pantalla de quien guarda, edad incluida, y en su lugar
// del orden (FR-019, FR-020a). La edad sin tocar sigue avanzando desde la de antes (FR-010).
export async function savePet(
  form: FormData,
): Promise<ActionResult<{ petId: string }, PetActionDetail>> {
  after(purgePetPhotos)
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const petId = formText(form, 'petId')
  try {
    const owned = await getMyPetAge(petId)
    if (owned === null) return { ok: false, error: 'pets.errors.not_found' }
    const gatePath = petGatePath(editPetPath(petId))
    if (!(await checkVerifiedPhone(petGateRequest(editPetPath(petId)))).ok) {
      return { ok: false, error: NEEDS_VERIFICATION, detail: { gatePath } }
    }

    const values = petFormValues(form)
    const today = uruguayDay(new Date())
    const age = resolveAgeOnSave({
      base: ageFromForm(form, 'ageBase'),
      shown: ageFromForm(form, 'ageShown'),
      submitted: { value: values.ageValue, unit: values.ageUnit },
      stored: owned.stored,
      publishedOn: owned.publishedOn,
      today,
    })
    const checked = validatePet(values, { ageUnchanged: age.unchanged })
    if (!checked.ok) {
      await trackContactRejections(checked.errors)
      return { ok: false, error: 'pets.errors.invalid', detail: { fields: checked.errors } }
    }

    const saved = await savePetRecord({
      ownerId: user.id,
      petId,
      pet: age.unchanged ? { ...checked.data, age: age.age } : checked.data,
      ageAsOf: age.unchanged ? age.age.asOf : today,
      photoIds: photoIdsFrom(form),
    })
    if (!saved.ok) {
      const detail = saved.error === NEEDS_VERIFICATION ? { gatePath } : undefined
      return { ...(await failed(saved.error, 'save_pet')), detail }
    }
    // Una foto sacada deja de existir al guardar (FR-020); si borrarla falla, queda para la purga.
    await deletePetPhotos(saved.released.map((id) => ({ id, ownerId: user.id })))
    await track('pet_edited', { litter: false })
    revalidatePath(MY_PETS_PATH)
    return { ok: true, data: { petId } }
  } catch (cause) {
    return failed(SAVE_FAILED, 'save_pet', cause)
  }
}

// Al recuperar lo escrito: si su intento ya publicó, el formulario no lo ofrece como sin publicar
// (spec, Edge Cases «Una respuesta perdida y después una recarga»).
export async function checkPetAttempt(
  attemptId: string,
): Promise<ActionResult<{ published: boolean }>> {
  if ((await getSessionUser()) === null) return { ok: false, error: SESSION }
  try {
    return { ok: true, data: { published: await isAttemptPublished(attemptId) } }
  } catch (cause) {
    return failed(SAVE_FAILED, 'check_pet_attempt', cause)
  }
}

const CONTACT_FIELDS: readonly PetField[] = ['name', 'description', 'locality']

// El rechazo que detecta el formulario antes de mandar. Acepta solo el campo y el tipo, de sus
// listas cerradas: nada de lo escrito puede colarse en la medición (FR-028).
export async function trackPetMoment(
  moment: 'pet_publish_started' | 'pet_contact_rejected',
  props: { field?: string; kind?: string; litter?: boolean } = {},
): Promise<ActionResult<null>> {
  if (moment === 'pet_publish_started') {
    await track('pet_publish_started', { litter: props.litter === true })
    return { ok: true, data: null }
  }
  const { field = '', kind = '' } = props
  if (!isOneOf(CONTACT_FIELDS, field) || !isOneOf(CONTACT_KINDS, kind)) {
    return { ok: false, error: SAVE_FAILED }
  }
  await track('pet_contact_rejected', { field, kind })
  return { ok: true, data: null }
}
