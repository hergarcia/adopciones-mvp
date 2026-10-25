'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { publicationOrdinal } from '@/lib/analytics/pet-events'
import { track } from '@/lib/analytics/track'
import { checkVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { formText } from '@/lib/forms/form-data'
import { litterFormValues } from '@/lib/litters/form-data'
import { PUBLISH_LITTER_PATH } from '@/lib/litters/paths'
import { uruguayDay } from '@/lib/pets/age'
import { normalizePetName } from '@/lib/pets/duplicate-name'
import { photoIdsFrom } from '@/lib/pets/form-data'
import { MY_PETS_PATH, petGatePath, petGateRequest } from '@/lib/pets/paths'
import { secondsSince } from '@/lib/pets/publish-seconds'
import { litterContactRejections, validateLitter, type LitterErrors } from '@/lib/schemas/litter'
import { purgePetPhotos } from '@/lib/supabase/queries/pet-photos'
import {
  isLitterAttemptPublished,
  listMyLitterNames,
  publishLitterRecord,
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
