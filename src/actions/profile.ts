'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { track } from '@/lib/analytics/track'
import { safeDestination } from '@/lib/auth/next-destination'
import { formText } from '@/lib/forms/form-data'
import { validateProfile } from '@/lib/schemas/profile'
import { deleteAvatar, deleteAvatarAsService, uploadAvatar } from '@/lib/supabase/queries/avatars'
import { deleteLinksFor } from '@/lib/supabase/queries/login-links'
import { deletePetPhotosAsService } from '@/lib/supabase/queries/pet-photos'
import { getMyProfile, upsertProfile } from '@/lib/supabase/queries/profiles'
import { deleteAccountRecord, endSession, getSessionUser } from '@/lib/supabase/queries/session'
import type { ActionResult } from './result'

export async function saveProfile(
  form: FormData,
): Promise<ActionResult<{ redirectTo: string; wasComplete: boolean }>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: 'profile.errors.save_failed' }

  const parsed = validateProfile({
    displayName: formText(form, 'displayName'),
    department: formText(form, 'department'),
    locality: formText(form, 'locality'),
    isRescuer: form.get('isRescuer') === 'true',
  })
  if (!parsed.ok) {
    return { ok: false, error: Object.values(parsed.errors)[0] ?? 'profile.errors.save_failed' }
  }

  const before = await getMyProfile()

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

  await track(before === null ? 'account_creation_finished' : 'profile_edited')

  revalidatePath('/mi-perfil')
  return {
    ok: true,
    data: {
      redirectTo: safeDestination(formText(form, 'next')),
      wasComplete: before !== null,
    },
  }
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
