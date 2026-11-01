// Quién lee y quién suma «Cómo le va a…» (historia #269, constitución §V): los números de una
// publicación los ve solo quien la publicó, y sumar es solo del servidor. Un visitante, otra persona,
// quien administra y la misma dueña lo intentan por fuera de la aplicación. La base local solo tiene
// datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { sql } from './listing-support'
import {
  countPetOpen,
  myPetStatsAs,
  petCounts,
  statsPeople,
  statsTableAs,
} from './publication-stats-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, ownerWithPet } = statsPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('los números, solo para quien publicó (FR-025)', () => {
  // Covers: US1-AS15, SC-003
  it('un visitante, otra persona y quien administra no los leen de la tabla ni de la función', async () => {
    const { owner, pet } = await ownerWithPet()
    expect(await countPetOpen(pet.code, null)).toBeNull()
    const callers = [
      ['un visitante', anonClient()],
      ['otra persona', (await person(2, 'Diego')).client],
      ['quien administra', (await admin()).client],
    ] as const

    const results = await Promise.all(
      callers.map(async ([who, client]) => {
        const [table, mine] = await Promise.all([
          statsTableAs(client),
          myPetStatsAs(client, pet.petId),
        ])
        return [who, table.error?.code, table.rows, mine.rows]
      }),
    )
    expect(results).toEqual(callers.map(([who]) => [who, '42501', [], []]))

    // La dueña tampoco lee la tabla directo: solo por la función, que le devuelve lo suyo.
    expect((await statsTableAs(owner.client)).error?.code).toBe('42501')
    expect((await myPetStatsAs(owner.client, pet.petId)).rows).toMatchObject([{ opens: 1 }])
  })

  // Covers: FR-026 (ni quién, ni cuándo, ni desde dónde)
  it('ninguna columna apunta a una persona ni guarda una hora', async () => {
    const columns = await sql<{ column_name: string; data_type: string }>(
      `select column_name, data_type from information_schema.columns
        where table_schema = 'public' and table_name = 'publication_stats'
        order by ordinal_position`,
    )
    expect(columns).toEqual([
      { column_name: 'id', data_type: 'uuid' },
      { column_name: 'pet_id', data_type: 'uuid' },
      { column_name: 'litter_id', data_type: 'uuid' },
      { column_name: 'opens', data_type: 'integer' },
      { column_name: 'taps', data_type: 'integer' },
      { column_name: 'phone_stops', data_type: 'integer' },
      { column_name: 'identity_stops', data_type: 'integer' },
      { column_name: 'counted_since', data_type: 'date' },
      { column_name: 'from_publication', data_type: 'boolean' },
    ])
    const targets = await sql<{ target: string }>(
      `select confrelid::regclass::text as target from pg_constraint
        where contype = 'f' and conrelid = 'public.publication_stats'::regclass
        order by 1`,
    )
    expect(targets).toEqual([{ target: 'litters' }, { target: 'pets' }])
  })
})

describeDb('sumar, solo desde el servidor (FR-027)', () => {
  const CALLS = [
    ['count_pet_open', (code: string) => ({ p_code: code })],
    ['count_litter_open', (code: string) => ({ p_code: code })],
    ['count_apply_tap', (code: string) => ({ p_code: code, p_tap: true, p_stop: 'phone' })],
  ] as const

  // Covers: FR-027, SC-003
  it.each(CALLS)(
    '%s: ni un visitante, ni otra persona, ni quien administra, ni la dueña',
    async (name, args) => {
      const { owner, pet } = await ownerWithPet()
      const clients = [
        anonClient(),
        (await person(2, 'Diego')).client,
        (await admin()).client,
        owner.client,
      ]
      const codes = await Promise.all(
        clients.map(async (client) => (await client.rpc(name, args(pet.code))).error?.code),
      )
      expect(codes).toEqual(['42501', '42501', '42501', '42501'])
      expect(await petCounts(pet.petId)).toEqual({
        opens: 0,
        taps: 0,
        phone_stops: 0,
        identity_stops: 0,
      })
    },
  )

  // Covers: FR-027 (nadie la escribe ni la pone en cero)
  it('nadie escribe la tabla con su sesión', async () => {
    const { owner, pet } = await ownerWithPet()
    expect(await countPetOpen(pet.code, null)).toBeNull()
    for (const client of [anonClient(), owner.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const update = await client
        .from('publication_stats')
        .update({ opens: 0 })
        .eq('pet_id', pet.petId)
      expect(update.error?.code).toBe('42501')
      // oxlint-disable-next-line no-await-in-loop
      const insert = await client.from('publication_stats').insert({ pet_id: pet.petId })
      expect(insert.error?.code).toBe('42501')
    }
    expect((await petCounts(pet.petId))?.opens).toBe(1)
  })
})
