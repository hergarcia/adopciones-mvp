// La pantalla de una solicitud escrita que no salió (historia #294). Lo que la base le dice a quien la
// escribió: el motivo y si el animal le recibe solicitudes hoy, que decide entre volver a él y ver
// otros; y los sugeridos con las reglas de #259. Nadie lee la de otra persona, ni la que todavía espera.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { heldPeople, insertHeld, withdrawHeld } from './held-applications-support'
import { setState } from './lifecycle-support'
import { futureWindow, listPet } from './listing-support'
import { block } from './moderation-support'
import { db, type Functions } from './phone-support'
import { anonClient, type SyntheticUser } from './roles'

type Client = SyntheticUser['client']
type SuggestedRow = Functions['held_suggested_pets']['Returns'][number]

const cleanups: SyntheticUser['cleanup'][] = []
const { person } = heldPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

const NEAR = { department: 'UY-TT', locality: 'Vergara' }
const FAR = { department: 'UY-RV', locality: 'Tranqueras' }

async function lapsedAs(client: Client, id: string) {
  const { data, error } = await client.rpc('my_lapsed_held_application', { p_id: id })
  return { rows: data ?? [], error }
}

async function suggestedAs(client: Client, id: string) {
  const { data, error } = await client.rpc('held_suggested_pets', { p_held_id: id, p_limit: 241 })
  const rows: SuggestedRow[] = data ?? []
  return { rows, error }
}

function ours(rows: { code: string }[], codes: readonly string[]): string[] {
  return rows.map((row) => row.code).filter((code) => codes.includes(code))
}

// Bruno vive en Treinta y Tres y dejó escrita una solicitud por Tobi, un perro de Carla.
async function scene() {
  const bruno = await person(1, 'Bruno')
  const { error } = await db()
    .from('profiles')
    .update({ department: NEAR.department })
    .eq('id', bruno.id)
  expect(error).toBeNull()
  const carla = await person(1, 'Carla')
  const tobi = await listPet(carla.id, { fields: { ...FAR, name: 'Tobi' } })
  const heldId = await insertHeld(bruno, tobi, carla)
  return { bruno, carla, tobi, heldId }
}

describeDb('una escrita que no salió, como la lee quien la escribió', () => {
  // Covers: historia #294, criterios 2 y 3
  it('trae el motivo y si el animal recibe hoy', async () => {
    const { bruno, tobi, heldId } = await scene()
    await withdrawHeld(bruno, heldId)

    const receiving = await lapsedAs(bruno.client, heldId)
    expect(receiving.error).toBeNull()
    expect(receiving.rows).toEqual([
      expect.objectContaining({
        id: heldId,
        lapse_reason: 'withdrawn',
        code: tobi.code,
        pet_name: 'Tobi',
        receiving: 'yes',
      }),
    ])

    await setState(tobi.petId, 'adopted')
    const adopted = await lapsedAs(bruno.client, heldId)
    expect(adopted.rows[0]?.receiving).toBe('closed')
  })

  // Covers: historia #294, criterio 4 (con un bloqueo no hay ficha a la que volver)
  it('con un bloqueo en cualquiera de los dos sentidos, el animal no le recibe', async () => {
    const first = await scene()
    await block(first.carla.id, first.bruno.id)
    const second = await scene()
    await block(second.bruno.id, second.carla.id)

    const blockedBy = await lapsedAs(first.bruno.client, first.heldId)
    const blocker = await lapsedAs(second.bruno.client, second.heldId)

    expect(blockedBy.rows).toEqual([
      expect.objectContaining({ lapse_reason: 'not_receiving', receiving: null }),
    ])
    expect(blocker.rows).toEqual([
      expect.objectContaining({ lapse_reason: 'you_blocked', code: null, receiving: null }),
    ])
  })

  it('la que todavía espera no tiene esta pantalla ni sugeridos', async () => {
    const { bruno, heldId } = await scene()

    const lapsed = await lapsedAs(bruno.client, heldId)
    const suggested = await suggestedAs(bruno.client, heldId)

    expect(lapsed.error).toBeNull()
    expect(lapsed.rows).toEqual([])
    expect(suggested.error).toBeNull()
    expect(suggested.rows).toEqual([])
  })
})

describeDb('los sugeridos de una escrita que no salió', () => {
  // Covers: historia #294, criterio 1
  it('de la misma especie, primero los cercanos, nunca de quien publicó ni uno que espera', async () => {
    const window = futureWindow()
    const { bruno, carla, tobi, heldId } = await scene()
    await setState(tobi.petId, 'adopted')
    const ana = await person(1, 'Ana')
    const dog = (minute: number, zone = FAR) =>
      listPet(ana.id, { publishedAt: window.at(minute), fields: zone })
    const near = await dog(1, NEAR)
    const far = await dog(2)
    const cat = await listPet(ana.id, {
      publishedAt: window.at(3),
      fields: { ...FAR, species: 'cat' },
    })
    const carlaDog = await listPet(carla.id, { publishedAt: window.at(4), fields: FAR })
    const waiting = await dog(5)
    await insertHeld(bruno, waiting, ana)
    const all = [near.code, far.code, cat.code, carlaDog.code, waiting.code]

    const { rows, error } = await suggestedAs(bruno.client, heldId)

    expect(error).toBeNull()
    expect(ours(rows, all)).toEqual([near.code, far.code])
  })

  // Covers: historia #294, privacidad de la solicitud
  it('otra persona no lee la de Bruno ni sus sugeridos, y sin sesión no se puede preguntar', async () => {
    const window = futureWindow()
    const { bruno, heldId } = await scene()
    await withdrawHeld(bruno, heldId)
    const ana = await person(1, 'Ana')
    await listPet(ana.id, { publishedAt: window.at(1), fields: NEAR })
    const stranger = await person(1, 'Otra')

    const lapsed = await lapsedAs(stranger.client, heldId)
    const suggested = await suggestedAs(stranger.client, heldId)
    expect(lapsed.error).toBeNull()
    expect(lapsed.rows).toEqual([])
    expect(suggested.error).toBeNull()
    expect(suggested.rows).toEqual([])

    const anonLapsed = await lapsedAs(anonClient(), heldId)
    const anonSuggested = await suggestedAs(anonClient(), heldId)
    expect(anonLapsed.error).not.toBeNull()
    expect(anonSuggested.error).not.toBeNull()
  })
})
