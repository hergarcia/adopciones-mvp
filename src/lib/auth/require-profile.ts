import { redirect } from 'next/navigation'
import { getMyProfile, type Profile } from '@/lib/supabase/queries/profiles'
import { getSessionUser } from '@/lib/supabase/queries/session'

// La compuerta de FR-013 y FR-016. La llama **cada página** con su propia ruta y no el layout del
// grupo: un layout no conoce la URL que se pidió, así que mandaría a todo el mundo de vuelta al
// mismo lado y quien iba a editar su perfil terminaría en otra pantalla (SC-008 pide volver al
// destino en el 100 % de los casos).
export async function requireProfile(currentPath: string): Promise<Profile> {
  const destination = `?next=${encodeURIComponent(currentPath)}`

  if ((await getSessionUser()) === null) redirect(`/entrar${destination}`)

  const profile = await getMyProfile()
  if (profile === null) redirect(`/completar-perfil${destination}`)

  return profile
}
