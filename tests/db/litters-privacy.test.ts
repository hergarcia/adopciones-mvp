// Lo que NO debe verse de una camada (historia #205, constitución §V): una camada que no está a la
// vista no deja leer lo común, sus crías ni sus fotos por ningún camino —la ficha, la vista previa,
// Storage, la tabla— ni sin sesión ni con otra cuenta. Cada regla se demuestra con un intento que
// tiene que fallar.
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { describeDb } from '../setup/env-report'
import { publishLitter, youngList } from './litter-support'
import { publishers, setPhone } from './listing-support'
import { block, suspend } from './moderation-support'
import { BUCKET, stagedPhotos, webp } from './pet-support'
import { db } from './phone-support'
import { anonClient, asNewUser, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const publisher = publishers(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

type Client = SyntheticUser['client']
type Row = Record<string, unknown>

async function stranger(): Promise<SyntheticUser> {
  const user = await asNewUser()
  cleanups.push(user.cleanup)
  return user
}

async function visitors() {
  const other = await stranger()
  return [
    { who: 'sin sesión', client: anonClient() },
    { who: 'otra cuenta', client: other.client },
  ]
}

async function upload(ownerId: string, photoIds: string[]) {
  const bucket = serviceClient().storage.from(BUCKET)
  await Promise.all(
    photoIds.map(async (photoId) => {
      const uploaded = await bucket.upload(`${ownerId}/${photoId}/card.webp`, webp(), {
        contentType: 'image/webp',
        upsert: true,
      })
      expect(uploaded.error).toBeNull()
    }),
  )
}

// Una camada de 3 crías de una persona con nivel 1: la primera con una foto propia, las otras sin.
async function shownLitter() {
  const owner = await publisher({ avatar: true })
  const [litterPhoto, youngPhoto] = await stagedPhotos(owner.id, 2)
  const young = youngList(3, [{ photo_ids: [youngPhoto], description: 'La más chica.' }])
  const { row, error } = await publishLitter(owner.id, [litterPhoto], young)
  expect(error).toBeNull()
  await upload(owner.id, [litterPhoto, youngPhoto])
  const { data: pets } = await db()
    .from('pets')
    .select('id, code, name')
    .eq('litter_id', String(row?.litter_id))
    .order('published_at')
  return {
    owner,
    litterId: String(row?.litter_id),
    code: String(row?.code),
    young: pets ?? [],
    paths: {
      litter: `${owner.id}/${litterPhoto}/card.webp`,
      young: `${owner.id}/${youngPhoto}/card.webp`,
    },
  }
}

type Litter = Awaited<ReturnType<typeof shownLitter>>

async function byCode(client: Client, code: string): Promise<Row[]> {
  const { data, error } = await client.rpc('litter_by_code', { p_code: code })
  expect(error).toBeNull()
  return data ?? []
}

async function shareCard(client: Client, code: string): Promise<Row[]> {
  const { data, error } = await client.rpc('litter_share_card', { p_code: code })
  expect(error).toBeNull()
  return data ?? []
}

async function signs(client: Client, path: string): Promise<boolean> {
  const { data } = await client.storage.from(BUCKET).createSignedUrl(path, 60)
  return data !== null
}

// Lo que devuelve la ficha cuando solo dice por qué no se ve: todo lo demás, nulo.
function whatItSays(rows: Row[]) {
  const [row] = rows
  const { visibility, is_owner: isOwner, ...rest } = row ?? {}
  const anythingElse = Object.entries(rest).filter(([, value]) => value !== null)
  return { rows: rows.length, visibility, isOwner, anythingElse }
}

async function takeDown(litter: Litter) {
  const fields = { taken_down_at: new Date().toISOString(), takedown_reason: 'sale_or_money' }
  const litters = await db().from('litters').update(fields).eq('id', litter.litterId)
  expect(litters.error).toBeNull()
  const young = await db().from('pets').update(fields).eq('litter_id', litter.litterId)
  expect(young.error).toBeNull()
}

describeDb('una camada a la vista', () => {
  // Covers: US2-AS1, US2-AS2, US2-AS3, FR-021, FR-026, FR-027, FR-028
  it('cualquiera lee lo común, quién la publica y sus crías, sin el id ni el motivo', async () => {
    const litter = await shownLitter()
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop -- dos visitantes, uno detrás del otro
      const [row] = await byCode(client, litter.code)
      expect(row).toMatchObject({
        visibility: 'listed',
        is_owner: false,
        litter_id: null,
        name: 'La camada de Luna',
        available_count: 3,
        publisher_name: 'Ana Rodríguez',
        publisher_level: 1,
        takedown_reason: null,
      })
      expect(row.photos).toHaveLength(1)
      const young = z.array(z.record(z.string(), z.unknown())).parse(row.young)
      expect(young.map((one) => [one.code, one.name])).toEqual(
        litter.young.map((one) => [one.code, one.name]),
      )
      expect(young.map((one) => z.array(z.unknown()).parse(one.photos).length)).toEqual([1, 0, 0])
      expect(young[0]).toMatchObject({
        description: 'La más chica.',
        my_active_id: null,
        my_rejected: false,
      })
      expect(Object.keys(young[0])).not.toContain('id')
    }
  })

  // Covers: US2-AS9, FR-036
  it('la vista previa lleva la portada, el nombre y la zona, con la versión de la ficha', async () => {
    const litter = await shownLitter()
    const [card] = await shareCard(anonClient(), litter.code)
    expect(card).toMatchObject({ name: 'La camada de Luna', locality: 'Pocitos' })
    const [row] = await byCode(anonClient(), litter.code)
    expect(card.version).toBe(row.version)
  })

  // Covers: FR-023, FR-028 (las fotos de la camada y de cada cría se firman a la vista)
  it('sus fotos y las de sus crías se firman', async () => {
    const litter = await shownLitter()
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await signs(client, litter.paths.litter)).toBe(true)
      // oxlint-disable-next-line no-await-in-loop
      expect(await signs(client, litter.paths.young)).toBe(true)
    }
  })

  // Covers: SC-003 (el enlace de una cría lleva a su camada, sin nada de la cría)
  it('pet_by_code de una cría devuelve solo el código de su camada', async () => {
    const litter = await shownLitter()
    const { data, error } = await anonClient().rpc('pet_by_code', {
      p_code: litter.young[0].code,
    })
    expect(error).toBeNull()
    const [row] = data ?? []
    const { visibility, litter_code: litterCode, is_owner: isOwner, ...rest } = row ?? {}
    expect({ visibility, litterCode, isOwner }).toEqual({
      visibility: 'young',
      litterCode: litter.code,
      isOwner: false,
    })
    expect(Object.values(rest).filter((value) => value !== null)).toEqual([])
  })

  // Covers: FR-023 (la tabla no se lee directo: todo pasa por las funciones)
  it('otra persona no lee la camada ni sus crías de las tablas; la dueña sí', async () => {
    const litter = await shownLitter()
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop
      const litters = await client.from('litters').select('id').eq('id', litter.litterId)
      expect(litters.data ?? []).toEqual([])
      // oxlint-disable-next-line no-await-in-loop
      const young = await client.from('pets').select('id').eq('litter_id', litter.litterId)
      expect(young.data ?? []).toEqual([])
    }
    const own = await litter.owner.client.from('litters').select('id').eq('id', litter.litterId)
    expect(own.data).toEqual([{ id: litter.litterId }])
  })
})

describeDb('una camada que no está a la vista', () => {
  // Covers: US2-AS11, FR-022, FR-023, FR-036, SC-003
  it('publicador sin nivel 1: solo dice hidden; ni vista previa ni fotos', async () => {
    const litter = await shownLitter()
    await setPhone(litter.owner.id, 'change_pending')
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop
      expect(whatItSays(await byCode(client, litter.code))).toEqual({
        rows: 1,
        visibility: 'hidden',
        isOwner: false,
        anythingElse: [],
      })
      // oxlint-disable-next-line no-await-in-loop
      expect(await shareCard(client, litter.code)).toEqual([])
      // oxlint-disable-next-line no-await-in-loop
      expect(await signs(client, litter.paths.litter)).toBe(false)
      // oxlint-disable-next-line no-await-in-loop
      expect(await signs(client, litter.paths.young)).toBe(false)
    }
  })

  describe('suspendida o dada de baja: como una que no existe', () => {
    // Covers: FR-022, FR-044, SC-003, Edge Cases (cuenta suspendida)
    it.each([
      { why: 'suspendida', hide: (litter: Litter) => suspend(litter.owner.id) },
      { why: 'dada de baja', hide: takeDown },
    ])('$why: sin fila, sin vista previa ni fotos', async ({ hide }) => {
      const litter = await shownLitter()
      await hide(litter)
      for (const { client } of await visitors()) {
        // oxlint-disable-next-line no-await-in-loop
        expect(await byCode(client, litter.code)).toEqual([])
        // oxlint-disable-next-line no-await-in-loop
        expect(await shareCard(client, litter.code)).toEqual([])
        // oxlint-disable-next-line no-await-in-loop
        expect(await signs(client, litter.paths.litter)).toBe(false)
        // oxlint-disable-next-line no-await-in-loop
        expect(await signs(client, litter.paths.young)).toBe(false)
      }
    })
  })

  // Covers: US2-AS13, FR-037, FR-047
  it('borrada la cuenta, o un código que no existe: sin fila', async () => {
    const litter = await shownLitter()
    await serviceClient().auth.admin.deleteUser(litter.owner.id)
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await byCode(client, litter.code)).toEqual([])
      // oxlint-disable-next-line no-await-in-loop
      expect(await byCode(client, 'zzzzzzzzzz')).toEqual([])
      // oxlint-disable-next-line no-await-in-loop
      expect(await shareCard(client, litter.code)).toEqual([])
    }
  })

  // Covers: FR-025, Edge Cases (persona bloqueada)
  it('quien bloqueó al publicador: solo blocked y a quién desbloquear, nada de la camada', async () => {
    const litter = await shownLitter()
    const viewer = await stranger()
    await block(viewer.id, litter.owner.id)
    const [row] = await byCode(viewer.client, litter.code)
    const { publisher_public_id: publicId, ...rest } = row ?? {}
    expect(whatItSays([rest])).toEqual({
      rows: 1,
      visibility: 'blocked',
      isOwner: false,
      anythingElse: [],
    })
    expect(publicId).toEqual(expect.any(String))
  })

  // Covers: US2-AS12, FR-024
  it.each([
    { why: 'sin nivel 1', visibility: 'hidden', reason: null },
    { why: 'dada de baja', visibility: 'hidden', reason: 'sale_or_money' },
  ])('$why: su dueña la ve entera, con el motivo', async ({ why, visibility, reason }) => {
    const litter = await shownLitter()
    if (why === 'sin nivel 1') await setPhone(litter.owner.id, 'change_pending')
    else await takeDown(litter)
    const [row] = await byCode(litter.owner.client, litter.code)
    expect(row).toMatchObject({
      visibility,
      is_owner: true,
      litter_id: litter.litterId,
      name: 'La camada de Luna',
      publisher_level: null,
      takedown_reason: reason,
    })
    expect(row.young).toHaveLength(3)
    expect(await signs(litter.owner.client, litter.paths.litter)).toBe(true)
  })
})
