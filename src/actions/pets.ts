'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { track } from '@/lib/analytics/track'
import { checkVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { formText } from '@/lib/forms/form-data'
import { resolveAgeOnSave, uruguayDay } from '@/lib/pets/age'
import { petFormValues, photoIdsFrom } from '@/lib/pets/form-data'
import {
  MY_PETS_PATH,
  PUBLISH_PATH,
  petGatePath,
  editPetPath,
  petGateRequest,
} from '@/lib/pets/paths'
import { publishDecision } from '@/lib/pets/publish-steps'
import { DRAFT_TTL_DAYS } from '@/lib/pets/rules'
import { contactRejections, validatePet, type PetFieldErrors } from '@/lib/schemas/pet'
import { deletePetPhotos, purgePetPhotos } from '@/lib/supabase/queries/pet-photos'
import { publishPetRecord, savePetRecord } from '@/lib/supabase/queries/pet-records'
import {
  countMyPets,
  getMyPetAge,
  isAttemptPublished,
  isUuid,
  listMyPetNames,
} from '@/lib/supabase/queries/pets'
import { getSessionUser } from '@/lib/supabase/queries/session'
import type { ActionResult } from './result'

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

// El ordinal de la publicación y no quién la hizo: contar a quienes publican un segundo animal es
// contar las segundas (FR-028).
function ordinal(count: number): string {
  return count >= 3 ? '3+' : String(count)
}

// Cuánto tardó desde que empezó la carga, acotado: un reloj corrido o un valor inventado no
// pueden dar un tiempo negativo ni de meses.
function secondsSince(startedAt: string, now: number): number {
  const started = Number(startedAt)
  const limit = DRAFT_TTL_DAYS * 24 * 60 * 60
  if (!Number.isFinite(started) || started > now) return 0
  return Math.min(Math.round((now - started) / 1000), limit)
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
      return { ok: false, error: saved.error, detail }
    }
    if (!saved.already) {
      await track('pet_published', {
        photos: photoIds.length,
        seconds: secondsSince(formText(form, 'startedAt'), Date.now()),
        ordinal: ordinal(await countMyPets()),
      })
      revalidatePath(MY_PETS_PATH)
    }
    return { ok: true, data: { already: saved.already } }
  } catch {
    return { ok: false, error: SAVE_FAILED }
  }
}

function ageFrom(form: FormData, prefix: 'ageBase' | 'ageShown') {
  const value = Number(formText(form, `${prefix}Value`))
  const unit = formText(form, `${prefix}Unit`) === 'years' ? 'years' : 'months'
  return {
    value: Number.isInteger(value) ? value : Number.NaN,
    unit,
    asOf: formText(form, `${prefix}AsOf`),
  } as const
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
      base: ageFrom(form, 'ageBase'),
      shown: ageFrom(form, 'ageShown'),
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
      return { ok: false, error: saved.error, detail }
    }
    // Una foto sacada deja de existir al guardar (FR-020); si borrarla falla, queda para la purga.
    await deletePetPhotos(saved.released.map((id) => ({ id, ownerId: user.id })))
    await track('pet_edited')
    revalidatePath(MY_PETS_PATH)
    return { ok: true, data: { petId } }
  } catch {
    return { ok: false, error: SAVE_FAILED }
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
  } catch {
    return { ok: false, error: SAVE_FAILED }
  }
}

const CONTACT_FIELDS = ['name', 'description', 'locality']
const CONTACT_KINDS = ['phone', 'email', 'web', 'social']

// El rechazo que detecta el formulario antes de mandar. Acepta solo el campo y el tipo, de sus
// listas cerradas: nada de lo escrito puede colarse en la medición (FR-028).
export async function trackPetMoment(
  moment: 'pet_publish_started' | 'pet_contact_rejected',
  props: { field?: string; kind?: string } = {},
): Promise<ActionResult<null>> {
  if (moment === 'pet_publish_started') {
    await track('pet_publish_started')
    return { ok: true, data: null }
  }
  const { field = '', kind = '' } = props
  if (!CONTACT_FIELDS.includes(field) || !CONTACT_KINDS.includes(kind)) {
    return { ok: false, error: SAVE_FAILED }
  }
  await track('pet_contact_rejected', { field, kind })
  return { ok: true, data: null }
}
