'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { track } from '@/lib/analytics/track'
import { safeDestination } from '@/lib/auth/next-destination'
import { SESSION_ERROR } from '@/lib/profile/save-failure'
import { parseSaveMoment, profileSaveOutcome } from '@/lib/profile/save-outcome'
import { validateProfile } from '@/lib/schemas/profile'
import { profileSaveReportSchema } from '@/lib/schemas/profile-save-report'
import { deleteAvatar, deleteAvatarAsService, uploadAvatar } from '@/lib/supabase/queries/avatars'
import { deleteLinksFor } from '@/lib/supabase/queries/login-links'
import { getMyProfile, upsertProfile } from '@/lib/supabase/queries/profiles'
import { deleteAccountRecord, endSession, getSessionUser } from '@/lib/supabase/queries/session'
import type { ActionResult } from './result'

export async function saveProfile(
  form: FormData,
): Promise<ActionResult<{ redirectTo: string; wasComplete: boolean }>> {
  const user = await getSessionUser()
  // Una sesión vencida no es una falla del sitio: lo que la persona tiene que hacer es otra cosa
  // (FR-008).
  if (user === null) return { ok: false, error: SESSION_ERROR }

  const parsed = validateProfile({
    displayName: text(form, 'displayName'),
    department: text(form, 'department'),
    locality: text(form, 'locality'),
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

  const mode = parseSaveMoment(form.get('mode'))
  const { events, wasComplete } = profileSaveOutcome({
    existedBefore: before !== null,
    mode,
    recovered: form.get('recovered') === 'true',
  })
  await Promise.all(events.map(({ name, props }) => track(name, props)))

  // Revalidar hace que Next vuelva a dibujar la pantalla desde la que se guardó, y la del alta
  // redirige a «Mi perfil» en cuanto el perfil existe: una respuesta que llega tarde, después del
  // aviso de no guardado, sacaría a la persona de lo que siguió escribiendo (FR-009). Desde el alta
  // no hace falta: el formulario navega a una pantalla dinámica, que se dibuja de nuevo igual.
  if (mode === 'edit') revalidatePath('/mi-perfil')
  return {
    ok: true,
    data: {
      redirectTo: safeDestination(text(form, 'next')),
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

// Un campo de FormData puede ser un archivo: convertirlo con String() daría "[object File]" y el
// schema lo tomaría por un nombre.
function text(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
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

    const links = await deleteLinksFor(user.email)
    if (!links.ok) return { ok: false, error: 'profile.errors.delete_failed' }

    const removed = await deleteAccountRecord(user.id)
    if (!removed.ok) return { ok: false, error: 'profile.errors.delete_failed' }

    await endSession()
  } catch {
    return { ok: false, error: 'profile.errors.delete_failed' }
  }

  await track('account_deleted')
  return redirect('/cuenta-borrada')
}
