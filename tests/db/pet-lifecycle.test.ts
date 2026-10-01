// El ciclo de vida de una publicación en la base (historia #59): la tabla de transiciones entera
// contra lo que ofrece la pantalla, el nivel 1 solo donde vuelve a poner el animal a la vista, que
// nadie toque lo ajeno, y borrar para siempre. La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { actionsFor, lifecycleOf, needsLevelOne } from '../../src/lib/pets/lifecycle'
import { PET_LIFETIME_DAYS, PET_REMINDER_DAYS } from '../../src/lib/pets/rules'
import {
  PET_STATES,
  PET_STATUS_ACTIONS,
  type PetState,
  type PetStatusAction,
} from '../../src/lib/pets/types'
import { describeDb } from '../setup/env-report'
import {
  LIFETIME_MS,
  change,
  changed,
  inDays,
  msFrom,
  petRow,
  setExpiry,
  setState,
} from './lifecycle-support'
import { futureWindow, listPet, publishers, sql } from './listing-support'
import { db } from './phone-support'
import { save } from './pet-support'
import { anonClient, asNewUser, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const publisher = publishers(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function petIn(ownerId: string, state: PetState) {
  const pet = await listPet(ownerId)
  await setState(pet.petId, state)
  return pet
}

// Lo que deja cada acción que se aplica: el estado guardado de la tabla de data-model.md.
const TARGET: Record<PetStatusAction, PetState | 'same'> = {
  mark_in_process: 'in_process',
  mark_available: 'available',
  pause: 'paused',
  resume: 'available',
  mark_adopted: 'adopted',
  renew: 'same',
  republish: 'available',
}

const ALREADY: [PetStatusAction, PetState][] = [
  ['mark_in_process', 'in_process'],
  ['mark_available', 'available'],
  ['pause', 'paused'],
  ['mark_adopted', 'adopted'],
]

function expectedOutcome(state: PetState, action: PetStatusAction): string {
  if (state === 'taken_down') return 'taken_down'
  if (actionsFor(state).includes(action)) return 'done'
  return ALREADY.some(([a, s]) => a === action && s === state) ? 'already' : 'changed'
}

describeDb('la tabla de transiciones', () => {
  // Covers: FR-001, FR-002, FR-004, FR-006, FR-007, US1-AS1, US1-AS2, US1-AS3, US1-AS6
  // (paridad de change_pet_status con actionsFor)
  it.each(PET_STATES)('desde %s, cada acción hace lo que ofrece la pantalla', async (state) => {
    const owner = await publisher()
    for (const action of PET_STATUS_ACTIONS) {
      // oxlint-disable-next-line no-await-in-loop -- un animal por acción, en orden
      const { petId } = await petIn(owner.id, state)
      // oxlint-disable-next-line no-await-in-loop
      const row = await changed(owner.id, petId, action)
      const outcome = expectedOutcome(state, action)
      expect({ action, outcome: row.outcome }).toEqual({ action, outcome })
      expect(row.from_state).toBe(state)
      const target = TARGET[action]
      expect(row.state).toBe(outcome === 'done' ? (target === 'same' ? state : target) : state)
      expect(row.name).toBe('Luna')
      expect(row.sex).toBe('female')
    }
  })

  // Covers: FR-002
  it('una acción que no existe no se aplica', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'available')
    const { error } = await change(owner.id, petId, 'take_down')
    expect(error?.message).toBe('invalid_action')
    expect((await petRow(petId))?.status).toBe('available')
  })
})

describeDb('el nivel 1', () => {
  // Covers: FR-003, US1-AS8
  it.each(PET_STATES.filter((state) => state !== 'taken_down'))(
    'desde %s sin nivel 1: solo reanudar, renovar y volver a publicar se frenan',
    async (state) => {
      const owner = await publisher({ phone: 'change_pending' })
      for (const action of actionsFor(state)) {
        // oxlint-disable-next-line no-await-in-loop -- un animal por acción, en orden
        const { petId } = await petIn(owner.id, state)
        // oxlint-disable-next-line no-await-in-loop
        const before = await petRow(petId)
        // oxlint-disable-next-line no-await-in-loop
        const row = await changed(owner.id, petId, action)
        // oxlint-disable-next-line no-await-in-loop
        const after = await petRow(petId)
        const blocked = needsLevelOne(action)
        expect({
          action,
          outcome: row.outcome,
          unchanged: JSON.stringify(after) === JSON.stringify(before),
        }).toEqual({ action, outcome: blocked ? 'needs_verification' : 'done', unchanged: blocked })
      }
    },
  )
})

describeDb('solo lo propio', () => {
  // Covers: FR-002, US1-AS11
  it('otra persona, o un animal que no existe, es «no existe» y nada cambia', async () => {
    const owner = await publisher()
    const other = await publisher()
    const { petId } = await petIn(owner.id, 'available')
    const before = await petRow(petId)

    for (const action of PET_STATUS_ACTIONS) {
      // oxlint-disable-next-line no-await-in-loop
      expect((await changed(other.id, petId, action)).outcome).toBe('not_found')
    }
    expect((await changed(owner.id, crypto.randomUUID(), 'pause')).outcome).toBe('not_found')
    expect(await petRow(petId)).toEqual(before)
  })

  // Covers: FR-005, US1-AS7
  it('otra persona no borra ni lee las fotos de un animal ajeno', async () => {
    const owner = await publisher()
    const other = await publisher()
    const { petId } = await listPet(owner.id, { photos: 2 })

    const ids = await serviceClient().rpc('pet_photo_ids', { p_owner: other.id, p_pet: petId })
    expect(ids.data).toEqual([])
    const deleted = await serviceClient().rpc('delete_pet', { p_owner: other.id, p_pet: petId })
    expect(deleted.data).toEqual([
      { outcome: 'not_found', code: null, from_state: null, photo_ids: [] },
    ])
    expect(await petRow(petId)).not.toBeNull()
  })
})

describeDb('el vencimiento al cambiar de estado', () => {
  // Covers: FR-004, FR-016, US1-AS2, US1-AS4, US1-AS5
  it('pausar congela, reanudar da 30 días desde ahora y en proceso no toca la fecha', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'available')
    await setExpiry(petId, inDays(3))
    await db()
      .from('pets')
      .update({ reminder_sent_at: inDays(-1) })
      .eq('id', petId)
    const published = (await petRow(petId))?.published_at

    const inProcess = await changed(owner.id, petId, 'mark_in_process')
    const available = await changed(owner.id, petId, 'mark_available')
    expect(inProcess.expires_at).toBe(available.expires_at)
    expect(msFrom(available.expires_at, Date.now() + 3 * 86_400_000)).toBeLessThan(60_000)

    const paused = await changed(owner.id, petId, 'pause')
    expect(paused.expires_at).toBeNull()

    const resumed = await changed(owner.id, petId, 'resume')
    expect(msFrom(resumed.expires_at, Date.now() + LIFETIME_MS)).toBeLessThan(60_000)
    const row = await petRow(petId)
    expect(row?.reminder_sent_at).toBeNull()
    expect(row?.expiry_counted_at).toBeNull()
    // Reanudar no lo sube en el listado.
    expect(row?.published_at).toBe(published)
  })

  // Covers: FR-004, US1-AS6
  it('volver a publicar una adoptada: disponible, 30 días nuevos y publicada ahora', async () => {
    const owner = await publisher()
    const { petId, code } = await petIn(owner.id, 'adopted')
    await db()
      .from('pets')
      .update({ published_at: inDays(-40) })
      .eq('id', petId)

    const row = await changed(owner.id, petId, 'republish')

    expect(row).toMatchObject({ outcome: 'done', state: 'available', code })
    expect(msFrom(row.expires_at, Date.now() + LIFETIME_MS)).toBeLessThan(60_000)
    expect(msFrom(row.published_at, Date.now())).toBeLessThan(60_000)
  })

  // Covers: FR-001, US1-AS3
  it('marcar adoptada saca la fecha; una vencida también se puede marcar adoptada', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'expired')
    const row = await changed(owner.id, petId, 'mark_adopted')
    expect(row).toMatchObject({ outcome: 'done', state: 'adopted', expires_at: null })
    const stored = await petRow(petId)
    expect(stored?.status).toBe('adopted')
    expect(msFrom(stored?.status_changed_at, Date.now())).toBeLessThan(60_000)
  })

  // Covers: FR-006
  it('una dada de baja no cambia con ninguna acción', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'taken_down')
    const before = await petRow(petId)
    for (const action of PET_STATUS_ACTIONS) {
      // oxlint-disable-next-line no-await-in-loop
      expect((await changed(owner.id, petId, action)).outcome).toBe('taken_down')
    }
    expect(await petRow(petId)).toEqual(before)
  })
})

describeDb('borrar para siempre', () => {
  // Covers: FR-005, FR-030, US1-AS7
  it('borra la fila y sus fotos, y el código no se vuelve a usar', async () => {
    const owner = await publisher()
    const { petId, code, photoIds } = await petIn(owner.id, 'taken_down')

    const ids = await serviceClient().rpc('pet_photo_ids', { p_owner: owner.id, p_pet: petId })
    expect(ids.data).toEqual(photoIds)

    const { data, error } = await serviceClient().rpc('delete_pet', {
      p_owner: owner.id,
      p_pet: petId,
    })
    expect(error).toBeNull()
    expect(data).toEqual([{ outcome: 'done', code, from_state: 'taken_down', photo_ids: photoIds }])
    expect(await petRow(petId)).toBeNull()
    const photos = await db().from('pet_photos').select('id').in('id', photoIds)
    expect(photos.data).toEqual([])
    const kept = await db().from('pet_codes').select('code').eq('code', code)
    expect(kept.data).toEqual([{ code }])

    const again = await serviceClient().rpc('delete_pet', { p_owner: owner.id, p_pet: petId })
    expect(again.data?.[0]?.outcome).toBe('not_found')
  })
})

describeDb('las reglas de la base son las de lib/pets/rules.ts', () => {
  // Covers: FR-014, FR-017 (research R3)
  it('30 días de vida y 7 de aviso', async () => {
    const [row] = await sql<{ lifetime: boolean; lead: boolean }>(
      `select private.pet_lifetime() = interval '${PET_LIFETIME_DAYS} days' as lifetime,
              private.pet_reminder_lead() = interval '${PET_REMINDER_DAYS} days' as lead`,
    )
    expect(row).toEqual({ lifetime: true, lead: true })
  })

  // Covers: FR-014 (research R1: pet_state y lifecycleOf cuentan igual)
  it('el estado derivado de la base es el de lifecycleOf', async () => {
    const now = new Date()
    const cases = [
      { status: 'available', expires: inDays(1), takenDown: null },
      { status: 'in_process', expires: inDays(1), takenDown: null },
      { status: 'available', expires: inDays(-1), takenDown: null },
      { status: 'in_process', expires: inDays(-1), takenDown: null },
      { status: 'paused', expires: null, takenDown: null },
      { status: 'adopted', expires: null, takenDown: null },
      { status: 'paused', expires: null, takenDown: inDays(-1) },
      { status: 'available', expires: inDays(1), takenDown: inDays(-1) },
    ] as const
    const literal = (value: string | null) => (value === null ? 'null' : `'${value}'`)
    const rows = await sql<{ state: string }>(
      cases
        .map(
          (c) =>
            `select private.pet_state('${c.status}', ${literal(c.expires)}::timestamptz,
                                      ${literal(c.takenDown)}::timestamptz) as state`,
        )
        .join(' union all '),
    )
    const expected = cases.map((c) =>
      lifecycleOf(
        {
          status: c.status,
          expiresAt: c.expires === null ? null : new Date(c.expires),
          takenDownAt: c.takenDown === null ? null : new Date(c.takenDown),
        },
        now,
      ),
    )
    expect(rows.map((row) => row.state)).toEqual(expected)
  })
})

describeDb('las funciones de escritura', () => {
  // Covers: FR-002 (nadie las llama desde el navegador)
  it('ni anónimo ni con sesión pueden llamarlas', async () => {
    const user = await asNewUser()
    cleanups.push(user.cleanup)
    const pet = crypto.randomUUID()
    for (const client of [anonClient(), user.client]) {
      const calls = [
        client.rpc('change_pet_status', {
          p_owner: user.id,
          p_pet: pet,
          p_action: 'pause',
          p_pending_ttl: '7 days',
        }),
        client.rpc('delete_pet', { p_owner: user.id, p_pet: pet }),
        client.rpc('pet_photo_ids', { p_owner: user.id, p_pet: pet }),
      ]
      // oxlint-disable-next-line no-await-in-loop
      for (const { error } of await Promise.all(calls)) expect(error?.code).toBe('42501')
    }
  })
})

describeDb('el vencimiento a los 30 días', () => {
  // Covers: FR-014, FR-015, US2-AS1, US2-AS2
  it.each(['available', 'in_process'] as const)(
    'renovar %s dos veces son 30 días desde la última, sin cambiar el estado ni la publicación',
    async (state) => {
      const owner = await publisher()
      const { petId } = await petIn(owner.id, state)
      await setExpiry(petId, inDays(5))
      await db()
        .from('pets')
        .update({ published_at: inDays(-25) })
        .eq('id', petId)
      const before = await petRow(petId)

      const first = await changed(owner.id, petId, 'renew')
      const second = await changed(owner.id, petId, 'renew')

      expect(first).toMatchObject({ outcome: 'done', state })
      expect(second).toMatchObject({ outcome: 'done', state })
      expect(msFrom(second.expires_at, Date.now() + LIFETIME_MS)).toBeLessThan(60_000)
      expect(new Date(String(second.expires_at)).getTime()).toBeGreaterThanOrEqual(
        new Date(String(first.expires_at)).getTime(),
      )
      const after = await petRow(petId)
      expect(after?.status).toBe(state)
      expect(after?.published_at).toBe(before?.published_at)
    },
  )

  // Covers: FR-016, US2-AS5
  it('editar no toca el vencimiento', async () => {
    const owner = await publisher()
    const { petId, photoIds } = await petIn(owner.id, 'available')
    const expiresAt = inDays(4)
    await setExpiry(petId, expiresAt)

    const { error } = await save(owner.id, petId, photoIds, { description: 'Juguetona y mimosa.' })

    expect(error).toBeNull()
    const row = await petRow(petId)
    expect(row?.description).toBe('Juguetona y mimosa.')
    expect(msFrom(row?.expires_at, new Date(expiresAt).getTime())).toBe(0)
  })

  // Covers: FR-006
  it('una dada de baja no se edita', async () => {
    const owner = await publisher()
    const { petId, photoIds } = await petIn(owner.id, 'taken_down')
    const before = await petRow(petId)

    const { error } = await save(owner.id, petId, photoIds, { description: 'Otra cosa.' })

    expect(error?.message).toBe('taken_down')
    expect(await petRow(petId)).toEqual(before)
  })

  // Covers: FR-014, US2-AS3 (research R1: sale en el instante, sin una tarea que llegue tarde)
  it('vence en el instante exacto: sale del listado y su enlace dice que venció', async () => {
    const window = futureWindow()
    const owner = await publisher()
    const { petId, code } = await listPet(owner.id, { publishedAt: window.at(1) })

    // Dentro de una transacción `now()` no avanza: vencer «ahora» es el instante exacto.
    const at = (expiry: string) =>
      sql<{ listed: number; visibility: string }>(`
        begin;
        update public.pets set expires_at = ${expiry} where id = '${petId}';
        select
          (select count(*) from public.listed_pets(
             p_after_published => '${window.end.toISOString()}',
             p_after_code => 'zzzzzzzzzz',
             p_limit => 241
           ) l where l.code = '${code}')::int as listed,
          (select b.visibility from public.pet_by_code('${code}') b) as visibility;
        rollback;
      `)

    expect(await at(`now() + interval '1 millisecond'`)).toEqual([
      { listed: 1, visibility: 'listed' },
    ])
    expect(await at('now()')).toEqual([{ listed: 0, visibility: 'expired' }])
  })

  // Covers: FR-014, FR-017, US2-AS3, US2-AS4
  it.each([
    { state: 'available', action: 'renew' },
    { state: 'paused', action: 'resume' },
    { state: 'expired', action: 'republish' },
  ] as const)(
    '$action abre un vencimiento nuevo: sin recordatorio ni vencimiento contados',
    async ({ state, action }) => {
      const owner = await publisher()
      const { petId } = await petIn(owner.id, state)
      await db()
        .from('pets')
        .update({ reminder_sent_at: inDays(-2), expiry_counted_at: inDays(-1) })
        .eq('id', petId)

      const row = await changed(owner.id, petId, action)

      expect(row).toMatchObject({ outcome: 'done', state: 'available' })
      const stored = await petRow(petId)
      expect(stored?.reminder_sent_at).toBeNull()
      expect(stored?.expiry_counted_at).toBeNull()
    },
  )

  // Covers: US2-AS4
  it('una en proceso que venció vuelve a publicarse disponible', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'in_process')
    await setExpiry(petId, inDays(-1))

    const row = await changed(owner.id, petId, 'republish')

    expect(row).toMatchObject({ outcome: 'done', from_state: 'expired', state: 'available' })
    expect((await petRow(petId))?.status).toBe('available')
  })
})
