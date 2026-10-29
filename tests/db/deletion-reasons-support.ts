// Lo que comparten las pruebas de «¿Por qué lo borrás?» (historia #263): un animal en cada estado,
// borrarlo como lo llama la aplicación y contar las respuestas de la tabla con el servicio. Las
// pruebas de base corren un archivo por vez, así que la diferencia de antes y después es de la
// prueba que la mide.
import { expect } from 'vitest'
import type { DeletionAnswer, DeletionKind } from '../../src/lib/pets/deletion-reason'
import type { PetState } from '../../src/lib/pets/types'
import type { Database } from '../../src/lib/supabase/types'
import { setState } from './lifecycle-support'
import { listPet } from './listing-support'
import { db } from './phone-support'
import { serviceClient } from './roles'

type Functions = Database['public']['Functions']
export type PetDeletion = Functions['delete_pet']['Returns'][number]

export async function petIn(ownerId: string, state: PetState) {
  const pet = await listPet(ownerId)
  await setState(pet.petId, state)
  return pet
}

/** `reason` ausente: la confirmación no mostró la pregunta. */
export async function deletePetAs(ownerId: string, petId: string, reason?: string) {
  const { data, error } = await serviceClient().rpc('delete_pet', {
    p_owner: ownerId,
    p_pet: petId,
    ...(reason === undefined ? {} : { p_reason: reason }),
  })
  return { row: data?.[0], error }
}

export type ReasonRow = { id: string; kind: string; reason: string; deleted_on: string }

/** Todas las respuestas guardadas, con todas sus columnas. */
export async function reasonRows(): Promise<ReasonRow[]> {
  const { data } = await db().from('deletion_reasons').select('*').throwOnError()
  return data
}

/** Cuántas respuestas hay de esa clase y esa respuesta. */
export async function reasonsOf(kind: DeletionKind, reason: DeletionAnswer): Promise<number> {
  const { count } = await db()
    .from('deletion_reasons')
    .select('id', { count: 'exact', head: true })
    .eq('kind', kind)
    .eq('reason', reason)
    .throwOnError()
  return count ?? 0
}

/** Corre `act` y devuelve las respuestas que dejó, sin el id. */
export async function reasonsLeftBy(act: () => Promise<unknown>) {
  const before = new Set((await reasonRows()).map((row) => row.id))
  await act()
  return (await reasonRows())
    .filter((row) => !before.has(row.id))
    .map(({ kind, reason, deleted_on }) => ({ kind, reason, deleted_on }))
}

export async function totalReasons(): Promise<number> {
  const { count } = await db()
    .from('deletion_reasons')
    .select('id', { count: 'exact', head: true })
    .throwOnError()
  return count ?? 0
}

/** El día de hoy en Uruguay, como lo cuenta la base. */
export async function uruguayToday(): Promise<string> {
  const { data, error } = await db().rpc('uruguay_today')
  expect(error).toBeNull()
  return String(data)
}
