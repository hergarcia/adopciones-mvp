import { getSessionUser } from '@/lib/supabase/queries/session'

// Al principio de cada página pública y de ingreso, y no en el layout: un layout no se vuelve a
// pintar al navegar dentro de su grupo, y una sesión abierta antes de la suspensión seguiría
// navegando (research R4). Sin sesión no pregunta nada más.
export async function redirectIfSuspended(): Promise<void> {
  await getSessionUser()
}
