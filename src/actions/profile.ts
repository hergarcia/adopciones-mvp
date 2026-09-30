'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PROFILE_CONTACT_FIELDS } from '@/lib/analytics/events'
import { track, trackAll } from '@/lib/analytics/track'
import { safeDestination } from '@/lib/auth/next-destination'
import { CONTACT_KINDS } from '@/lib/contact/contact-match'
import { isOneOf } from '@/lib/pets/options'
import { formText } from '@/lib/forms/form-data'
import { SESSION_ERROR } from '@/lib/profile/save-failure'
import { parseSaveMoment, profileSaveOutcome } from '@/lib/profile/save-outcome'
import { profileContactRejections, validateProfile } from '@/lib/schemas/profile'
import { profileSaveReportSchema } from '@/lib/schemas/profile-save-report'
import { deleteAvatar, deleteAvatarAsService, uploadAvatar } from '@/lib/supabase/queries/avatars'
import { deleteLinksFor } from '@/lib/supabase/queries/login-links'
import { deletePetPhotosAsService } from '@/lib/supabase/queries/pet-photos'
import { findProfile, upsertProfile } from '@/lib/supabase/queries/profiles'
import {
  deleteAccountRecord,
  endSession,
  getSessionUser,
  lookupSession,
} from '@/lib/supabase/queries/session'
import type { ActionResult } from './result'

export async function saveProfile(
  form: FormData,
): Promise<ActionResult<{ redirectTo: string; wasComplete: boolean }>> {
  const { user, failed } = await lookupSession()
  // Una sesión vencida no es una falla del sitio: lo que la persona tiene que hacer es otra cosa
  // (FR-008). Pero no poder preguntar por la sesión sí lo es (FR-003): mandarla a entrar de nuevo
  // descartaría lo que estaba editando por una falla que un reintento resuelve.
  if (user === null) {
    return { ok: false, error: failed ? 'profile.errors.save_failed' : SESSION_ERROR }
  }

  const parsed = validateProfile({
    displayName: formText(form, 'displayName'),
    department: formText(form, 'department'),
    locality: formText(form, 'locality'),
    isRescuer: form.get('isRescuer') === 'true',
  })
  if (!parsed.ok) {
    await Promise.all(
      profileContactRejections(parsed.errors).map((rejected) =>
        track('profile_contact_rejected', rejected),
      ),
    )
    return {
      ok: false,
      error: Object.values(parsed.errors)[0]?.key ?? 'profile.errors.save_failed',
    }
  }

  const before = await findProfile(user.id)
  if (before.failed) return { ok: false, error: 'profile.errors.save_failed' }

  // El archivo viaja en la acción y lo sube el servidor: el navegador no habla con el
  // almacenamiento, así que no necesita credenciales y el límite de tipo y tamaño del bucket se
  // aplica de este lado.
  const avatar = form.get('avatar')
  let avatarPath: string | null | undefined
  if (avatar instanceof File && avatar.size > 0) {
    const uploaded = await uploadAvatar(user.id, avatar)
    if (uploaded === null) return { ok: false, error: 'profile.errors.photo_failed' }
    avatarPath = uploaded.path
  } else if (form.get('removeAvatar') === 'true') {
    await deleteAvatar(user.id)
    avatarPath = null
  }

  const saved = await upsertProfile({ id: user.id, ...parsed.data, avatarPath })
  if (!saved.ok) return { ok: false, error: 'profile.errors.save_failed' }

  const mode = parseSaveMoment(form.get('mode'))
  const { events, wasComplete } = profileSaveOutcome({
    existedBefore: before.profile !== null,
    mode,
    recovered: form.get('recovered') === 'true',
  })
  await trackAll(events)

  // Revalidar hace que Next vuelva a dibujar la pantalla desde la que se guardó, y la del alta
  // redirige a «Mi perfil» en cuanto el perfil existe: una respuesta que llega tarde, después del
  // aviso de no guardado, sacaría a la persona de lo que siguió escribiendo (FR-009). Desde el alta
  // no hace falta: el formulario navega a una pantalla dinámica, que se dibuja de nuevo igual.
  if (mode === 'edit') revalidatePath('/mi-perfil')
  return {
    ok: true,
    data: {
      redirectTo: safeDestination(formText(form, 'next')),
      wasComplete,
    },
  }
}

// La medición nunca frena ni le informa nada a la persona: un reporte que no valida se descarta
// entero y la respuesta es la misma. No pide sesión, para no perder los fallos de quien se quedó sin
// ella; no guarda nada.
export async function reportProfileSaveFailures(payload: unknown): Promise<ActionResult<null>> {
  const parsed = profileSaveReportSchema.safeParse(payload)
  if (parsed.success) {
    await Promise.all(parsed.data.failures.map((failure) => track('profile_save_failed', failure)))
  }
  return { ok: true, data: null }
}

// Los momentos del perfil que pasan en el navegador (FR-028 de la historia #12): el enlace copiado
// y el rechazo por contacto que detecta el formulario antes de mandar. Se validan contra listas
// cerradas: el cliente puede mandar cualquier cosa.
export async function trackProfileMoment(
  moment: 'profile_link_copied' | 'profile_contact_rejected',
  props: { field?: string; kind?: string } = {},
): Promise<ActionResult<null>> {
  if (moment === 'profile_link_copied') {
    await track('profile_link_copied')
    return { ok: true, data: null }
  }
  const { field = '', kind = '' } = props
  if (!isOneOf(PROFILE_CONTACT_FIELDS, field) || !isOneOf(CONTACT_KINDS, kind)) {
    return { ok: false, error: 'profile.errors.save_failed' }
  }
  await track('profile_contact_rejected', { field, kind })
  return { ok: true, data: null }
}

// El borrado va de menos a más irreversible y **cada paso se comprueba**: si alguno falla, no se
// confirma nada y el reintento retoma donde quedó (FR-028a).
//
// La sesión se cierra al final, no al principio: cerrarla primero dejaría el reintento sin sesión
// con la que identificarse, así que un borrado que falló a mitad quedaría imposible de terminar.
// Borrar la persona ya revoca sus tokens de refresco en todos los dispositivos (FR-028); el cierre
// local es lo que limpia la cookie de este navegador.
export async function deleteAccount(): Promise<ActionResult<null>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: 'profile.errors.delete_failed' }

  try {
    const photo = await deleteAvatarAsService(user.id)
    if (!photo.ok) return { ok: false, error: 'profile.errors.delete_failed' }

    // Las fotos de los animales, también las de un intento sin terminar (FR-027 de la historia
    // #53). Dos barridos: uno antes de borrar la persona y otro después de la cascada, así una
    // subida que anotó su fila y sube sus objetos en el medio tampoco queda (research R20).
    const petPhotos = await deletePetPhotosAsService(user.id)
    if (!petPhotos.ok) return { ok: false, error: 'profile.errors.delete_failed' }

    const links = await deleteLinksFor(user.email)
    if (!links.ok) return { ok: false, error: 'profile.errors.delete_failed' }

    const removed = await deleteAccountRecord(user.id)
    if (!removed.ok) return { ok: false, error: 'profile.errors.delete_failed' }

    // Borrada la persona, un error acá ya no se puede reintentar desde la cuenta: se insiste una
    // vez y se sigue. Lo que suba después lo borra `uploadPetPhoto`, que no encuentra su fila.
    if (!(await deletePetPhotosAsService(user.id)).ok) await deletePetPhotosAsService(user.id)

    await endSession()
  } catch {
    return { ok: false, error: 'profile.errors.delete_failed' }
  }

  await track('account_deleted')
  return redirect('/cuenta-borrada')
}
