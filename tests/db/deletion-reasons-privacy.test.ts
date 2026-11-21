// Nadie lee «¿Por qué lo borrás?» por fuera de la base (historia #263, FR-024 a FR-026, SC-003,
// research R1). Cada prueba lo intenta como quien no debe: un visitante y la persona que borró y
// contestó. La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { deletePetAs, petIn } from './deletion-reasons-support'
import { publishers, sql } from './listing-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const publisher = publishers(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('la tabla no se lee ni se escribe con la API (R1)', () => {
  // Covers: FR-026, SC-003 (tampoco quien contestó)
  it('ni un visitante ni quien borró y contestó', async () => {
    const carla = await publisher()
    const { petId } = await petIn(carla.id, 'available')
    expect((await deletePetAs(carla.id, petId, 'no_applications')).row?.reason_counted).toBe(true)

    for (const client of [anonClient(), carla.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const read = await client.from('deletion_reasons').select('*')
      expect(read.error?.code).toBe('42501')
      // oxlint-disable-next-line no-await-in-loop
      const write = await client.from('deletion_reasons').insert({ kind: 'pet', reason: 'other' })
      expect(write.error?.code).toBe('42501')
    }
  })

  // Covers: FR-024, FR-025 (ni la persona, ni el animal, ni la hora)
  it('ninguna columna apunta a una persona, un animal o una camada, y no guarda la hora', async () => {
    const columns = await sql<{ column_name: string; data_type: string }>(
      `select column_name, data_type from information_schema.columns
        where table_schema = 'public' and table_name = 'deletion_reasons'
        order by ordinal_position`,
    )
    expect(columns).toEqual([
      { column_name: 'id', data_type: 'uuid' },
      { column_name: 'kind', data_type: 'text' },
      { column_name: 'reason', data_type: 'text' },
      { column_name: 'deleted_on', data_type: 'date' },
    ])
    const foreign = await sql<{ count: number }>(
      `select count(*)::int as count from pg_constraint
        where contype = 'f' and conrelid = 'public.deletion_reasons'::regclass`,
    )
    expect(foreign[0]?.count).toBe(0)
  })
})

describeDb('borrar se llama solo desde el servidor (SC-003)', () => {
  const CALLS = [
    ['delete_pet', { p_owner: crypto.randomUUID(), p_pet: crypto.randomUUID(), p_reason: 'other' }],
    [
      'delete_litter',
      { p_owner: crypto.randomUUID(), p_litter: crypto.randomUUID(), p_reason: 'other' },
    ],
  ] as const

  it.each(CALLS)('%s: ni un visitante ni una persona con sesión', async (name, args) => {
    const carla = await publisher()
    for (const client of [anonClient(), carla.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const { error } = await client.rpc(name, args)
      expect(error?.code).toBe('42501')
    }
  })
})
