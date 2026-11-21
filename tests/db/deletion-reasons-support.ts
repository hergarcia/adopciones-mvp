// Lo que comparten las pruebas de «¿Por qué lo borrás?» (historia #263): un animal y una camada en
// cada estado, borrarlos como los llama la aplicación y contar las respuestas de la tabla con el
// servicio. Las
// pruebas de base corren un archivo por vez, así que la diferencia de antes y después es de la
// prueba que la mide.
import { expect } from 'vitest'
import type { LitterState } from '../../src/lib/litters/types'
import type { DeletionAnswer, DeletionKind } from '../../src/lib/pets/deletion-reason'
import type { PetState } from '../../src/lib/pets/types'
import type { Database } from '../../src/lib/supabase/types'
import { setState } from './lifecycle-support'
import { expireLitter, litterWithYoung, pauseLitter, setYoungState } from './litter-support'
import { listPet, sql } from './listing-support'
import { db } from './phone-support'
import { serviceClient, type SyntheticUser } from './roles'

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

/**
 * Una camada de tres crías en `state`. Fuera de adoptada, dos crías ya se dieron y queda una sin
 * hogar, que con `lastInProcess` está en proceso: la camada sigue preguntando (FR-002).
 */
export async function litterIn(
  ownerId: string,
  state: LitterState,
  options: { lastInProcess?: boolean } = {},
) {
  const litter = await litterWithYoung(ownerId, 3)
  const [first, second, last] = litter.young.map((one) => one.id)
  if (first === undefined || second === undefined || last === undefined) {
    throw new Error('la camada no tiene tres crías')
  }
  await setYoungState(first, 'adopted')
  await setYoungState(second, 'adopted')
  if (state === 'adopted') await setYoungState(last, 'adopted')
  else if (options.lastInProcess) await setYoungState(last, 'in_process')
  if (state === 'paused') await pauseLitter(litter.litterId)
  if (state === 'expired') await expireLitter(litter.litterId)
  if (state === 'taken_down') {
    const { error } = await db()
      .from('litters')
      .update({ taken_down_at: new Date().toISOString(), takedown_reason: 'sale_or_money' })
      .eq('id', litter.litterId)
    expect(error).toBeNull()
  }
  expect(await litterStateOf(litter.litterId)).toBe(state)
  return { ...litter, lastId: last }
}

/** El estado de la camada como lo lee la base al borrarla. */
export async function litterStateOf(litterId: string): Promise<string | undefined> {
  const [row] = await sql<{ state: string }>(
    `select private.litter_state(l) as state from public.litters l where l.id = '${litterId}'`,
  )
  return row?.state
}

/** `reason` ausente: la confirmación no mostró la pregunta, o se quitó la última cría. */
export async function deleteLitterAs(ownerId: string, litterId: string, reason?: string) {
  const { data, error } = await serviceClient().rpc('delete_litter', {
    p_owner: ownerId,
    p_litter: litterId,
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

export type ReasonSummaryRow = Functions['admin_deletion_reason_summary']['Returns'][number]

/** «Por qué se borraron animales» como lo lee esa sesión. */
export async function reasonSummaryAs(client: SyntheticUser['client']) {
  const { data, error } = await client.rpc('admin_deletion_reason_summary')
  const rows: ReasonSummaryRow[] = data ?? []
  return { rows, error }
}

/** Lo que cambió cada combinación entre dos lecturas, sin las que quedaron igual. */
export function summaryDiff(before: ReasonSummaryRow[], after: ReasonSummaryRow[]) {
  return Object.fromEntries(
    after
      .map((row) => {
        const old = before.find((one) => one.kind === row.kind && one.reason === row.reason)
        return [`${row.kind}.${row.reason}`, row.total - (old?.total ?? 0)] as const
      })
      .filter(([, change]) => change !== 0),
  )
}
