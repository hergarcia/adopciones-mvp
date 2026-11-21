// Los animales del perfil (historia #238): la misma función del listado con el filtro de dueña. Lo que
// prueba es que por el perfil no se lee nada que el listado no muestre: pausados, vencidos, adoptados,
// de baja, sin teléfono de hoy, de una cuenta suspendida o de alguien que quien mira bloqueó.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { setState } from './lifecycle-support'
import { listLitter, youngList } from './litter-support'
import {
  futureWindow,
  listPet,
  listedAfter,
  publicIdOf,
  publishers,
  setPhone,
  type Window,
} from './listing-support'
import { block, lift, suspend } from './moderation-support'
import { anonClient, asNewUser, type SyntheticUser } from './roles'

type Client = SyntheticUser['client']
type ProfileRow = { code: string; kind: string; status: string; published_at: string }

const cleanups: SyntheticUser['cleanup'][] = []
const publisher = publishers(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function stranger(): Promise<SyntheticUser> {
  const user = await asNewUser()
  cleanups.push(user.cleanup)
  return user
}

async function profilePets(
  client: Client,
  publicId: string,
  page: { limit?: number; after?: { published_at: string; code: string } } = {},
): Promise<ProfileRow[]> {
  const { data, error } = await client.rpc('listed_pets', {
    p_owner_public_id: publicId,
    p_limit: page.limit ?? 241,
    p_after_published: page.after?.published_at,
    p_after_code: page.after?.code,
  })
  expect(error).toBeNull()
  return data ?? []
}

const codes = (rows: { code: string }[]) => rows.map((row) => row.code)

// Una dueña con un animal en cada estado y una camada, y otra persona con uno en la misma ventana.
async function rescuer(window: Window) {
  const owner = await publisher({ rescuer: true })
  const at = (minute: number) => ({ publishedAt: window.at(minute) })
  const [first, second, inProcess, paused, expired, adopted, takenDown] = await Promise.all([
    listPet(owner.id, at(1)),
    listPet(owner.id, at(2)),
    listPet(owner.id, at(3)),
    listPet(owner.id, at(4)),
    listPet(owner.id, at(5)),
    listPet(owner.id, at(6)),
    listPet(owner.id, at(7)),
  ])
  await Promise.all([
    setState(inProcess.petId, 'in_process'),
    setState(paused.petId, 'paused'),
    setState(expired.petId, 'expired'),
    setState(adopted.petId, 'adopted'),
    setState(takenDown.petId, 'taken_down'),
  ])
  const litter = await listLitter(owner.id, window.at(8), youngList(5))
  const other = await publisher()
  const others = await listPet(other.id, at(9))
  const hidden = [paused, expired, adopted, takenDown].map((pet) => pet.code)
  return {
    owner,
    publicId: await publicIdOf(owner.id),
    shown: [litter.code, inProcess.code, second.code, first.code],
    ownedCodes: new Set([litter.code, first.code, second.code, inProcess.code, ...hidden]),
    othersCode: others.code,
  }
}

describeDb('los animales del perfil son los del listado de esa persona', () => {
  // Covers: FR-002, FR-003, US1-AS1, US1-AS3, US1-AS5, US1-AS6
  it('sin sesión: los cuatro a la vista, la camada una vez, en el orden del listado', async () => {
    const window = futureWindow()
    const carla = await rescuer(window)
    const anon = anonClient()

    const rows = await profilePets(anon, carla.publicId)

    expect(codes(rows)).toEqual(carla.shown)
    expect(rows.map((row) => [row.kind, row.status])).toEqual([
      ['litter', 'available'],
      ['pet', 'in_process'],
      ['pet', 'available'],
      ['pet', 'available'],
    ])
    expect(codes(rows)).not.toContain(carla.othersCode)
    const listing = await listedAfter(anon, window)
    expect(codes(listing)).toContain(carla.othersCode)
    expect(codes(listing.filter((row) => carla.ownedCodes.has(row.code)))).toEqual(codes(rows))
  })

  // Covers: FR-006
  it('un perfil que no existe no trae nada', async () => {
    expect(await profilePets(anonClient(), 'AAAAAAAAAAAAAAAAAAAAAA')).toEqual([])
  })

  // Covers: FR-007, US1-AS11
  it('la dueña con su sesión ve lo mismo que cualquiera, sin el pausado', async () => {
    const carla = await rescuer(futureWindow())

    expect(codes(await profilePets(carla.owner.client, carla.publicId))).toEqual(carla.shown)
  })

  // Covers: FR-004, US1-AS7
  it('sin el teléfono de hoy no trae nada, y vuelve al confirmarlo', async () => {
    const carla = await rescuer(futureWindow())
    const anon = anonClient()

    await setPhone(carla.owner.id, 'change_pending')
    expect(await profilePets(anon, carla.publicId)).toEqual([])

    await setPhone(carla.owner.id, 'level_one')
    expect(codes(await profilePets(anon, carla.publicId))).toEqual(carla.shown)
  })

  // Covers: FR-004, US1-AS13
  it('con la cuenta suspendida no trae nada, y vuelve al reactivarla', async () => {
    const carla = await rescuer(futureWindow())
    const anon = anonClient()

    const suspension = await suspend(carla.owner.id)
    expect(await profilePets(anon, carla.publicId)).toEqual([])

    await lift(suspension)
    expect(codes(await profilePets(anon, carla.publicId))).toEqual(carla.shown)
  })

  // Covers: FR-004, US1-AS8, US1-AS9
  it('quien bloqueó a la dueña no ve nada; a quien ella bloqueó, sí', async () => {
    const carla = await rescuer(futureWindow())
    const diego = await stranger()
    const blocked = await stranger()
    await block(diego.id, carla.owner.id)
    await block(carla.owner.id, blocked.id)

    expect(await profilePets(diego.client, carla.publicId)).toEqual([])
    expect(codes(await profilePets(blocked.client, carla.publicId))).toEqual(carla.shown)
  })

  // Covers: US1-AS4
  it('con 30 a la vista, de a 24: el cursor no repite ni saltea', async () => {
    const window = futureWindow()
    const owner = await publisher()
    const pets = await Promise.all(
      Array.from({ length: 30 }, (_, index) =>
        listPet(owner.id, { publishedAt: window.at(index + 1) }),
      ),
    )
    const publicId = await publicIdOf(owner.id)
    const anon = anonClient()

    const first = await profilePets(anon, publicId, { limit: 25 })
    expect(first).toHaveLength(25)
    const firstShown = first.slice(0, 24)
    const rest = await profilePets(anon, publicId, {
      limit: 25,
      after: firstShown[23],
    })

    expect(rest).toHaveLength(6)
    const newestFirst = pets.map((pet) => pet.code).toReversed()
    expect([...codes(firstShown), ...codes(rest)]).toEqual(newestFirst)
  })
})
