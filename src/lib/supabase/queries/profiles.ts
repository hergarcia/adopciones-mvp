import { cache } from 'react'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { isDepartmentCode, type DepartmentCode } from '@/lib/zones/departments'

export type Profile = {
  id: string
  displayName: string
  department: DepartmentCode
  locality: string
  isRescuer: boolean
  avatarPath: string | null
}

type Row = {
  id: string
  display_name: string
  department: string
  locality: string
  is_rescuer: boolean
  avatar_path: string | null
}

const COLUMNS = 'id, display_name, department, locality, is_rescuer, avatar_path'

// Devuelve null tanto sin sesión como con el perfil todavía sin completar: para las compuertas
// las dos cosas significan lo mismo, que esta persona no puede usar las pantallas de la app.
//
// En caché por pedido, por lo mismo que `getSessionUser`: la compuerta, el menú y la página la
// piden por separado y sería la misma consulta tres veces.
export const getMyProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data } = await supabase
    .from('profiles')
    .select(COLUMNS)
    .eq('id', auth.user.id)
    .maybeSingle()
  return data ? toProfile(data) : null
})

export async function upsertProfile(input: {
  id: string
  displayName: string
  department: string
  locality: string
  isRescuer: boolean
  avatarPath?: string | null
}): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('profiles').upsert({
    id: input.id,
    display_name: input.displayName,
    department: input.department,
    locality: input.locality,
    is_rescuer: input.isRescuer,
    ...(input.avatarPath === undefined ? {} : { avatar_path: input.avatarPath }),
  })

  return { ok: error === null }
}

export async function clearAvatarPath(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  await supabase.from('profiles').update({ avatar_path: null }).eq('id', id)
}

// Con permisos de servicio porque corre dentro del borrado de cuenta, que también borra la
// persona del servicio de autenticación.
export async function deleteProfile(id: string): Promise<void> {
  await createServiceSupabase().from('profiles').delete().eq('id', id)
}

function toProfile(row: Row): Profile {
  // El `check` de la migración ya garantiza que solo entran los diecinueve códigos, pero el tipo
  // que llega de la base es `string`: la guarda convierte esa garantía en algo que el compilador
  // pueda ver, sin castear.
  if (!isDepartmentCode(row.department)) {
    throw new Error(`departamento fuera de la lista en el perfil ${row.id}: ${row.department}`)
  }

  return {
    id: row.id,
    displayName: row.display_name,
    department: row.department,
    locality: row.locality,
    isRescuer: row.is_rescuer,
    avatarPath: row.avatar_path,
  }
}
