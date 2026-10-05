// Bloquear y desbloquear (historia #13, US3): el bloqueo borra los avales de las dos direcciones y
// no deja dar otros; saca del listado y de la ficha de quien bloqueó los animales de la bloqueada,
// sin tocar lo que ve la bloqueada; y nadie más que quien bloqueó (y quien administra) lo lee.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { countedInWindow, futureWindow, listPet, listedAfter } from './listing-support'
import {
  block,
  moderationPeople,
  queueOf,
  readAs,
  report,
  suspend,
  type Person,
} from './moderation-support'
import { db, type Functions } from './phone-support'
import { anonClient, serviceClient, type SyntheticUser } from './roles'
import { countVouches, countingOf, give, remove, standing, vouchersOf } from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin } = moderationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

type Client = SyntheticUser['client']
type BlockedRow = Functions['blocked_profile']['Returns'][number]
type MyBlockRow = Functions['my_blocks']['Returns'][number]

async function blockAs(blocker: Person, target: Person): Promise<string> {
  const { data, error } = await db().rpc('block_person', {
    p_blocker: blocker.id,
    p_public_id: target.publicId,
  })
  expect(error).toBeNull()
  return data ?? ''
}

async function unblockAs(blocker: Person, target: Person): Promise<string> {
  const { data, error } = await db().rpc('unblock_person', {
    p_blocker: blocker.id,
    p_public_id: target.publicId,
  })
  expect(error).toBeNull()
  return data ?? ''
}

async function blocksOf(blocker: Person): Promise<MyBlockRow[]> {
  const { data, error } = await db().rpc('my_blocks', { p_user: blocker.id })
  expect(error).toBeNull()
  return data ?? []
}

async function blockedProfile(viewer: Person, target: Person): Promise<BlockedRow[]> {
  const { data, error } = await db().rpc('blocked_profile', {
    p_viewer: viewer.id,
    p_public_id: target.publicId,
  })
  expect(error).toBeNull()
  return data ?? []
}

async function byCode(client: Client, code: string) {
  const { data, error } = await client.rpc('pet_by_code', { p_code: code })
  expect(error).toBeNull()
  const rows: Functions['pet_by_code']['Returns'] = data ?? []
  return rows
}

async function reviewQueueOf(client: Client): Promise<string[]> {
  const { data, error } = await client.rpc('pet_review_queue', { p_limit: 100 })
  expect(error).toBeNull()
  return (data ?? []).map((row: { pet_id: string }) => row.pet_id)
}

async function blockRows(blocker: string, blocked: string): Promise<number> {
  const { count, error } = await db()
    .from('blocks')
    .select('*', { count: 'exact', head: true })
    .eq('blocker_id', blocker)
    .eq('blocked_id', blocked)
  expect(error).toBeNull()
  return count ?? 0
}

describeDb('bloquear a una persona', () => {
  // Covers: US3-AS3, FR-016
  it('borra los avales de las dos direcciones, sin escribir una quita, y los niveles bajan', async () => {
    const [ana, bea] = [await person(2, 'Ana'), await person(2, 'Bea')]
    const carla = await person(2, 'Carla')
    expect((await give(ana, bea)).outcome).toBe('given')
    expect((await give(carla, ana)).outcome).toBe('given')
    // `give_vouch` no deja dar el recíproco: se escribe directo, así hay un aval en cada sentido.
    const inserted = await db().from('vouches').insert({ voucher_id: bea.id, vouchee_id: ana.id })
    expect(inserted.error).toBeNull()
    expect(await countVouches('vouches', bea.id, ana.id)).toBe(1)
    expect(await countingOf(bea)).toBe(1)

    expect(await blockAs(ana, bea)).toBe('blocked')

    expect(await countVouches('vouches', ana.id, bea.id)).toBe(0)
    expect(await countVouches('vouches', bea.id, ana.id)).toBe(0)
    expect(await countVouches('vouch_blocks', ana.id, bea.id)).toBe(0)
    expect(await countVouches('vouch_blocks', bea.id, ana.id)).toBe(0)
    expect(await countingOf(bea)).toBe(0)
    expect(await vouchersOf(ana)).toEqual([carla.publicId])
    expect(await blockRows(ana.id, bea.id)).toBe(1)
  })

  it('bloquear de nuevo dice que ya estaba, y queda uno solo', async () => {
    const [ana, bea] = [await person(1), await person(1)]
    expect(await blockAs(ana, bea)).toBe('blocked')
    expect(await blockAs(ana, bea)).toBe('already')
    expect(await blockRows(ana.id, bea.id)).toBe(1)
  })

  // Covers: Edge Cases (bloquearse a sí misma), FR-014
  it('NO se bloquea a sí misma, ni a una cuenta que no existe, ni a una suspendida', async () => {
    const [ana, bea] = [await person(1), await person(1)]
    expect(await blockAs(ana, ana)).toBe('self')
    expect(
      (await db().rpc('block_person', { p_blocker: ana.id, p_public_id: 'noexiste00' })).data,
    ).toBe('not_found')
    await suspend(bea.id)
    expect(await blockAs(ana, bea)).toBe('not_found')
    expect(await blockRows(ana.id, bea.id)).toBe(0)
  })

  it('a una suspendida que ya estaba bloqueada, bloquearla de nuevo dice que ya estaba (FR-017a)', async () => {
    const [ana, bea] = [await person(1), await person(1)]
    await block(ana.id, bea.id)
    await suspend(bea.id)
    expect(await blockAs(ana, bea)).toBe('already')
  })

  // Covers: US3-AS4, FR-016, FR-017
  it('mientras dura, ninguna de las dos avala a la otra: «unavailable», sin motivo', async () => {
    const [ana, bea] = [await person(2), await person(2)]
    await blockAs(ana, bea)
    expect((await give(ana, bea)).outcome).toBe('unavailable')
    expect((await give(bea, ana)).outcome).toBe('unavailable')
    expect(await countVouches('vouches', ana.id, bea.id)).toBe(0)
    expect(await countVouches('vouches', bea.id, ana.id)).toBe(0)
  })

  // Covers: US3-AS2, US3-AS4
  it('la relación dice quién bloqueó a quién, a cada una lo suyo', async () => {
    const [ana, bea, carla] = [await person(1), await person(1), await person(1)]
    await blockAs(ana, bea)
    expect(await standing(ana, bea)).toMatchObject({
      viewer_blocked_target: true,
      target_blocked_viewer: false,
    })
    expect(await standing(bea, ana)).toMatchObject({
      viewer_blocked_target: false,
      target_blocked_viewer: true,
    })
    expect(await standing(carla, bea)).toMatchObject({
      viewer_blocked_target: false,
      target_blocked_viewer: false,
    })
  })
})

describeDb('desbloquear', () => {
  // Covers: US3-AS6, FR-016
  it('los avales no vuelven, pero cualquiera de las dos puede darlo de nuevo', async () => {
    const [ana, bea] = [await person(2), await person(2)]
    expect((await give(ana, bea)).outcome).toBe('given')
    await blockAs(ana, bea)

    expect(await unblockAs(ana, bea)).toBe('unblocked')
    expect(await blockRows(ana.id, bea.id)).toBe(0)
    expect(await countVouches('vouches', ana.id, bea.id)).toBe(0)
    expect((await give(bea, ana)).outcome).toBe('given')
  })

  it('una quita de la #12 sigue valiendo después de desbloquear', async () => {
    const [ana, bea] = [await person(2), await person(2)]
    expect((await give(bea, ana)).outcome).toBe('given')
    expect(await remove(ana, bea)).toBe('removed')
    await blockAs(ana, bea)
    await unblockAs(ana, bea)
    expect((await give(bea, ana)).outcome).toBe('blocked')
    expect((await give(ana, bea)).outcome).toBe('given')
  })

  it('desbloquear lo que no estaba es «absent»; la bloqueada no desbloquea', async () => {
    const [ana, bea] = [await person(1), await person(1)]
    expect(await unblockAs(ana, bea)).toBe('absent')
    await blockAs(ana, bea)
    expect(await unblockAs(bea, ana)).toBe('absent')
    expect(await blockRows(ana.id, bea.id)).toBe(1)
  })
})

describeDb('Mis bloqueos y el perfil bloqueado', () => {
  // Covers: FR-017b
  it('lista a quiénes bloqueé, del más reciente al más viejo, también a una suspendida', async () => {
    const [ana, bea, carla] = [await person(1), await person(1, 'Bea'), await person(1, 'Carla')]
    await blockAs(ana, bea)
    await blockAs(ana, carla)
    await suspend(bea.id)

    const rows = await blocksOf(ana)
    expect(rows.map((row) => [row.public_id, row.display_name, row.has_photo])).toEqual([
      [carla.publicId, 'Carla', false],
      [bea.publicId, 'Bea', false],
    ])
    expect(await blocksOf(bea)).toEqual([])
  })

  // Covers: US3-AS2, FR-017a
  it('el perfil bloqueado da el nombre solo a quien bloqueó, también si está suspendida', async () => {
    const [ana, bea, carla] = [await person(1), await person(1, 'Bea'), await person(1)]
    await blockAs(ana, bea)
    expect(await blockedProfile(ana, bea)).toEqual([{ display_name: 'Bea', is_suspended: false }])
    expect(await blockedProfile(bea, ana)).toEqual([])
    expect(await blockedProfile(carla, bea)).toEqual([])

    await suspend(bea.id)
    expect(await blockedProfile(ana, bea)).toEqual([{ display_name: 'Bea', is_suspended: true }])
  })

  // Covers: FR-041
  it('borrar cualquiera de las dos cuentas borra el bloqueo', async () => {
    const [ana, bea, carla] = [await person(1), await person(1), await person(1)]
    await blockAs(ana, bea)
    await blockAs(carla, ana)
    const { error } = await serviceClient().auth.admin.deleteUser(ana.id)
    expect(error).toBeNull()
    expect(await blockRows(ana.id, bea.id)).toBe(0)
    expect(await blockRows(carla.id, ana.id)).toBe(0)
  })
})

describeDb('los animales de una persona bloqueada', () => {
  // Covers: US3-AS5, FR-015, FR-015a
  it('salen del listado de quien bloqueó, de la cantidad, y las páginas siguen completas', async () => {
    const [ana, bea, carla] = [await person(1), await person(1), await person(1)]
    const window = futureWindow()
    // Intercalados: un animal de Bea cada cinco, así una página filtrada después de leerla tendría
    // huecos.
    const minutes = Array.from({ length: 30 }, (_, index) => index + 1)
    const pets = await Promise.all(
      minutes.map(async (minute) => {
        const owner = minute % 5 === 0 ? bea : carla
        const pet = await listPet(owner.id, { publishedAt: window.at(minute) })
        return { minute, owner, code: pet.code }
      }),
    )
    // Del más nuevo al más viejo, como el listado.
    const carlas = pets
      .filter((pet) => pet.owner === carla)
      .toSorted((a, b) => b.minute - a.minute)
      .map((pet) => pet.code)
    await blockAs(ana, bea)

    const page = await listedAfter(ana.client, window, { p_limit: 24 })
    expect(page.map((row) => row.code)).toEqual(carlas.slice(0, 24))
    expect(await countedInWindow(ana.client, window)).toBe(24)
    expect(await countedInWindow(anonClient(), window)).toBe(30)
  })

  // Covers: US3-AS9, FR-017
  it('la bloqueada ve los de quien la bloqueó, como cualquiera', async () => {
    const [ana, bea] = [await person(1), await person(1)]
    const window = futureWindow()
    const pet = await listPet(ana.id, { publishedAt: window.at(1) })
    await blockAs(ana, bea)

    expect((await listedAfter(bea.client, window)).map((row) => row.code)).toEqual([pet.code])
    expect(await byCode(bea.client, pet.code)).toEqual([
      expect.objectContaining({ visibility: 'listed', name: 'Luna', publisher_public_id: null }),
    ])
  })

  // Covers: US3-AS5, FR-017a
  it('la ficha dice «blocked» a quien bloqueó, sin nada del animal, también si está suspendida', async () => {
    const [ana, bea] = [await person(1), await person(1)]
    const pet = await listPet(bea.id)
    await blockAs(ana, bea)

    const [row] = await byCode(ana.client, pet.code)
    expect(row).toMatchObject({
      visibility: 'blocked',
      is_owner: false,
      publisher_public_id: bea.publicId,
    })
    const leaked = Object.entries(row ?? {}).filter(
      ([key, value]) =>
        !['visibility', 'is_owner', 'publisher_public_id'].includes(key) && value !== null,
    )
    expect(leaked).toEqual([])

    await suspend(bea.id)
    expect((await byCode(ana.client, pet.code))[0]?.visibility).toBe('blocked')
    expect(await byCode(anonClient(), pet.code)).toEqual([])
  })

  it('la dueña ve su ficha aunque haya bloqueado a quien mira, o la hayan bloqueado', async () => {
    const [ana, bea] = [await person(1), await person(1)]
    const pet = await listPet(bea.id)
    await blockAs(bea, ana)
    await blockAs(ana, bea)
    expect((await byCode(bea.client, pet.code))[0]).toMatchObject({
      visibility: 'listed',
      is_owner: true,
    })
  })

  // Covers: FR-015a
  it('Publicaciones por revisar y la lista de reportes NO cambian por un bloqueo de quien administra', async () => {
    const [lucia, bea, marta] = [await admin(), await person(1), await person(1)]
    const pet = await listPet(bea.id)
    await report(marta, bea)
    await blockAs(lucia, bea)

    expect(await reviewQueueOf(lucia.client)).toContain(pet.petId)
    const queue = await queueOf(lucia.client)
    expect(queue.map((row) => row.reported_public_id)).toContain(bea.publicId)
  })
})

describeDb('quién lee los bloqueos', () => {
  // Covers: FR-040, FR-042
  it('quien bloqueó lee los suyos, y quien administra todos', async () => {
    const [lucia, ana, bea] = [await admin(), await person(1), await person(1)]
    await blockAs(ana, bea)

    const own = await readAs(ana.client, 'blocks')
    expect(own.error).toBeNull()
    expect(own.rows).toEqual([expect.objectContaining({ blocker_id: ana.id, blocked_id: bea.id })])
    const all = await readAs(lucia.client, 'blocks')
    expect(all.rows).toContainEqual(expect.objectContaining({ blocker_id: ana.id }))
  })

  // Covers: FR-017, FR-042. Quien administra también puede ser la bloqueada.
  it('NO lee quién la bloqueó quien administra', async () => {
    const [lucia, ana, bea] = [await admin(), await person(1), await person(1)]
    await blockAs(ana, lucia)
    await blockAs(ana, bea)

    const { rows } = await readAs(lucia.client, 'blocks')
    expect(rows).toContainEqual(expect.objectContaining({ blocker_id: ana.id, blocked_id: bea.id }))
    expect(rows.filter((row) => row.blocked_id === lucia.id)).toEqual([])
  })

  it('NO los lee la bloqueada, ni otra persona, ni sin sesión', async () => {
    const [ana, bea, carla] = [await person(1), await person(1), await person(1)]
    await blockAs(ana, bea)

    expect((await readAs(bea.client, 'blocks')).rows).toEqual([])
    expect((await readAs(carla.client, 'blocks')).rows).toEqual([])
    const anon = await readAs(anonClient(), 'blocks')
    expect(anon.rows).toEqual([])
  })
})

describeDb('la foto de una suspendida', () => {
  // Covers: FR-017a, FR-020, FR-042. La ruta que sirve la foto no dice que la cuenta existe.
  it('no sale para nadie, salvo para quien la bloqueó', async () => {
    const [ana, marta, carla] = [await person(1, 'Ana'), await person(1), await person(1)]
    const photo = `${ana.id}/avatar.webp`
    const { error } = await db().from('profiles').update({ avatar_path: photo }).eq('id', ana.id)
    expect(error).toBeNull()
    await blockAs(marta, ana)
    const pathFor = async (viewer: Person | null) =>
      (
        await db().rpc('avatar_path_for', {
          p_public_id: ana.publicId,
          ...(viewer === null ? {} : { p_viewer: viewer.id }),
        })
      ).data
    expect(await pathFor(null)).toBe(photo)
    expect(await pathFor(carla)).toBe(photo)

    await suspend(ana.id)

    expect(await pathFor(null)).toBeNull()
    expect(await pathFor(carla)).toBeNull()
    expect(await pathFor(marta)).toBe(photo)
  })
})
