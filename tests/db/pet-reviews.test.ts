// La revisión de quien administra (historia #59, US4): toda publicación nueva o editada espera en la
// lista; solo quien administra la lee y la resuelve, nunca la suya, una sola vez; una baja la saca
// de todos lados; y lo que no debe verse —la revisión, quién decidió, la zona y el contacto de quien
// publica, las fotos fuera de la espera— se demuestra con un intento que falla.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { makeAdmin } from './identity-support'
import {
  countedInWindow,
  futureWindow,
  listPet,
  listedAfter,
  publishers,
  setPhone,
  type PhoneState,
} from './listing-support'
import { applicationPeople, applicationsOf, submit } from './applications-support'
import {
  listLitter,
  publishLitter,
  saveLitter,
  savedYoungOf,
  youngList,
  youngOf,
} from './litter-support'
import { PENDING_TTL, levelOne, published, save, stagedPhotos, uploadObjects } from './pet-support'
import { db, firstRow } from './phone-support'
import { anonClient, asNewUser, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const publisher = publishers(cleanups)
const people = applicationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

type Client = SyntheticUser['client']
type QueueRow = Record<string, unknown> & { pet_id: string }

async function admin(): Promise<SyntheticUser> {
  const user = await asNewUser()
  cleanups.push(user.cleanup)
  await makeAdmin(user.id)
  return user
}

async function stranger(): Promise<SyntheticUser> {
  const user = await asNewUser()
  cleanups.push(user.cleanup)
  return user
}

async function reviewOf(petId: string) {
  const { data, error } = await db()
    .from('pet_reviews')
    .select('*')
    .eq('pet_id', petId)
    .maybeSingle()
  expect(error).toBeNull()
  return data
}

// Una espera propia de cada prueba, en el año 1000: queda primera en la lista aunque haya otras.
function pastWindow() {
  const start = Date.UTC(1000, 0, 1) + Math.floor(Math.random() * 5 * 365 * 24 * 60) * 60_000
  return (minute: number) => new Date(start + minute * 60_000).toISOString()
}

async function waitingSince(petId: string, at: string) {
  const { error } = await db().from('pet_reviews').update({ pending_since: at }).eq('pet_id', petId)
  expect(error).toBeNull()
}

async function pendingPet(phone: PhoneState = 'level_one', options: { upload?: boolean } = {}) {
  const owner = await publisher({ phone, avatar: true })
  const pet = await listPet(owner.id, { upload: options.upload, photos: 2 })
  const review = await reviewOf(pet.petId)
  return { owner, ...pet, since: String(review?.pending_since) }
}

async function queue(client: Client) {
  const { data, error } = await client.rpc('pet_review_queue', { p_limit: 100 })
  const rows: QueueRow[] = data ?? []
  return { rows, error }
}

async function resolve(
  adminId: string,
  petId: string,
  knownSince: string,
  outcome: 'reviewed' | 'taken_down',
  reason?: string,
  note?: string,
) {
  const { data, error } = await serviceClient().rpc('resolve_pet_review', {
    p_admin: adminId,
    p_pet: petId,
    p_known_since: knownSince,
    p_outcome: outcome,
    ...(reason === undefined ? {} : { p_reason: reason }),
    ...(note === undefined ? {} : { p_note: note }),
  })
  expect(error).toBeNull()
  const rows: { decision: string }[] = data ?? []
  return rows[0]?.decision
}

describeDb('entrar a la lista', () => {
  // Covers: FR-022, US4-AS1
  it('publicar la pone a esperar como nueva, desde ese momento', async () => {
    const owner = await publisher()
    const before = Date.now()
    const { petId } = await published(owner.id)
    const review = await reviewOf(petId)
    expect(review).toMatchObject({ pending_kind: 'new', resolved_at: null, outcome: null })
    expect(Math.abs(new Date(String(review?.pending_since)).getTime() - before)).toBeLessThan(
      60_000,
    )
  })

  // Covers: FR-022, US4-AS4
  it('editar una revisada la vuelve a la lista como editada, y sigue a la vista', async () => {
    const reviewer = await admin()
    const owner = await publisher()
    const { petId, photoIds } = await published(owner.id)
    const first = await reviewOf(petId)
    expect(await resolve(reviewer.id, petId, String(first?.pending_since), 'reviewed')).toBe(
      'reviewed',
    )

    const saved = await save(owner.id, petId, photoIds, { name: 'Tobi' })
    expect(saved.error).toBeNull()
    const again = await reviewOf(petId)
    expect(again).toMatchObject({ pending_kind: 'edited', outcome: 'reviewed' })
    expect(new Date(String(again?.pending_since)).getTime()).toBeGreaterThan(
      new Date(String(first?.pending_since)).getTime(),
    )
    const pet = await db().from('pets').select('taken_down_at').eq('id', petId).single()
    expect(pet.data?.taken_down_at).toBeNull()
  })

  // Covers: spec §Edge Cases (editada antes de revisarla)
  it('editar una que todavía espera no la duplica ni la marca editada', async () => {
    const owner = await publisher()
    const { petId, photoIds } = await published(owner.id)
    const first = await reviewOf(petId)
    expect((await save(owner.id, petId, photoIds, { name: 'Tobi' })).error).toBeNull()
    expect(await reviewOf(petId)).toEqual(first)
  })
})

describeDb('quién ve la lista', () => {
  // Covers: FR-023, FR-029, US4-AS7
  it('la revisión no la lee nadie que no administre', async () => {
    const pet = await pendingPet()
    const other = await stranger()

    const anonymous = await anonClient().from('pet_reviews').select('*').eq('pet_id', pet.petId)
    expect(anonymous.data ?? []).toEqual([])
    for (const client of [other.client, pet.owner.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const read = await client.from('pet_reviews').select('*').eq('pet_id', pet.petId)
      expect(read.error).toBeNull()
      expect(read.data).toEqual([])
    }

    const reviewer = await admin()
    const read = await reviewer.client.from('pet_reviews').select('*').eq('pet_id', pet.petId)
    expect(read.data).toHaveLength(1)
  })

  // Covers: FR-023, US4-AS7
  it('la lista está vacía para quien no administra, y anónimo no la puede pedir', async () => {
    await pendingPet()
    const other = await stranger()
    expect(await queue(other.client)).toEqual({ rows: [], error: null })
    expect((await queue(anonClient())).error).not.toBeNull()
    const count = await other.client.rpc('count_pet_reviews')
    expect(count.data).toBe(0)
  })

  // Covers: FR-024, US4-AS1, spec §Pantallas (de la que más espera a la que menos)
  it('de la que más espera a la que menos, con todo del animal y nada del contacto', async () => {
    const reviewer = await admin()
    const at = pastWindow()
    const pets = [await pendingPet(), await pendingPet('none'), await pendingPet()]
    await Promise.all(pets.map((pet, index) => waitingSince(pet.petId, at(3 - index))))
    await db()
      .from('pets')
      .update({ description: 'Llamame al noventa y nueve' })
      .eq('id', pets[0].petId)
    await db().from('pets').update({ status: 'paused', expires_at: null }).eq('id', pets[1].petId)

    const { rows, error } = await queue(reviewer.client)
    expect(error).toBeNull()
    const mine = rows.filter((row) => pets.some((pet) => pet.petId === row.pet_id))
    expect(mine.map((row) => row.pet_id)).toEqual(pets.map((pet) => pet.petId).reverse())
    expect(rows.slice(0, 3)).toEqual(mine)

    const [, paused, described] = mine
    expect(described).toMatchObject({
      code: pets[0].code,
      description: 'Llamame al noventa y nueve',
      pending_kind: 'new',
      state: 'available',
      is_own: false,
      publisher_name: 'Ana Rodríguez',
      publisher_level: 1,
      publisher_avatar_path: `${pets[0].owner.id}/avatar.webp`,
    })
    expect(described.photos).toHaveLength(2)
    expect(paused).toMatchObject({ state: 'paused', publisher_level: null })
    for (const [row, pet] of [
      [described, pets[0]],
      [paused, pets[1]],
    ] as const) {
      const text = JSON.stringify(row)
      const secrets = [pet.owner.profileLocality, pet.owner.email, pet.owner.phone]
      for (const secret of secrets.filter((value) => value !== null)) {
        expect(text).not.toContain(secret)
      }
    }
  })
})

describeDb('resolver', () => {
  // Covers: FR-026, US4-AS5, FR-028
  it('la propia se ve marcada, no se resuelve y no cuenta en «Mi perfil»', async () => {
    const reviewer = await admin()
    const other = await admin()
    const before = {
      mine: (await reviewer.client.rpc('count_pet_reviews')).data,
      other: (await other.client.rpc('count_pet_reviews')).data,
    }
    const own = await listPet(reviewer.id)
    await waitingSince(own.petId, pastWindow()(0))
    const since = String((await reviewOf(own.petId))?.pending_since)

    const { rows } = await queue(reviewer.client)
    expect(rows.find((row) => row.pet_id === own.petId)).toMatchObject({ is_own: true })
    expect(rows[0]?.others).toBe(Number(rows[0]?.total) - 1)
    expect((await reviewer.client.rpc('count_pet_reviews')).data).toBe(before.mine)
    expect((await other.client.rpc('count_pet_reviews')).data).toBe(Number(before.other) + 1)

    expect(await resolve(reviewer.id, own.petId, since, 'reviewed')).toBe('own')
    expect(await resolve(reviewer.id, own.petId, since, 'taken_down', 'sale_or_money')).toBe('own')
    expect(await reviewOf(own.petId)).toMatchObject({ pending_kind: 'new', resolved_by: null })
  })

  // Covers: FR-026, US4-AS6
  it('dos que administran: la segunda ve que ya se resolvió y nada cambia', async () => {
    const first = await admin()
    const second = await admin()
    const pet = await pendingPet()

    expect(await resolve(first.id, pet.petId, pet.since, 'taken_down', 'sale_or_money')).toBe(
      'taken_down',
    )
    expect(await resolve(second.id, pet.petId, pet.since, 'reviewed')).toBe('closed')
    expect(await reviewOf(pet.petId)).toMatchObject({
      outcome: 'taken_down',
      resolved_by: first.id,
      pending_since: null,
      pending_kind: null,
    })
  })

  // Covers: FR-026 (lo que vio la pantalla ya no es lo que espera)
  it('una espera que no es la que vio la pantalla es «ya se resolvió»', async () => {
    const reviewer = await admin()
    const pet = await pendingPet()
    const stale = new Date(new Date(pet.since).getTime() - 1000).toISOString()
    expect(await resolve(reviewer.id, pet.petId, stale, 'reviewed')).toBe('closed')
    expect(await reviewOf(pet.petId)).toMatchObject({ pending_kind: 'new', outcome: null })
  })

  // Covers: FR-023 (quien deja de administrar pierde el acceso en ese momento)
  it('quien dejó de administrar no resuelve nada', async () => {
    const reviewer = await admin()
    const pet = await pendingPet()
    await db().from('admins').delete().eq('user_id', reviewer.id)
    expect(await resolve(reviewer.id, pet.petId, pet.since, 'reviewed')).toBe('not_admin')
    expect(await queue(reviewer.client)).toEqual({ rows: [], error: null })
    expect(await reviewOf(pet.petId)).toMatchObject({ pending_kind: 'new' })
  })

  // Covers: spec §Edge Cases (una que se borra con la lista abierta), FR-030
  it('borrar la publicación borra su revisión, y resolverla dice que ya no existe', async () => {
    const reviewer = await admin()
    const pet = await pendingPet()
    const deleted = await serviceClient().rpc('delete_pet', {
      p_owner: pet.owner.id,
      p_pet: pet.petId,
    })
    expect(deleted.error).toBeNull()
    expect(await reviewOf(pet.petId)).toBeNull()
    expect(await resolve(reviewer.id, pet.petId, pet.since, 'reviewed')).toBe('gone')
  })

  // Covers: FR-025 (el motivo «otro» lleva su texto, y solo él)
  it('una baja sin el motivo que le corresponde no se aplica', async () => {
    const reviewer = await admin()
    const pet = await pendingPet()
    for (const [reason, note] of [
      [undefined, undefined],
      ['other', undefined],
      ['sale_or_money', 'Texto de más'],
    ] as const) {
      // oxlint-disable-next-line no-await-in-loop
      const { error } = await serviceClient().rpc('resolve_pet_review', {
        p_admin: reviewer.id,
        p_pet: pet.petId,
        p_known_since: pet.since,
        p_outcome: 'taken_down',
        ...(reason === undefined ? {} : { p_reason: reason }),
        ...(note === undefined ? {} : { p_note: note }),
      })
      expect(error?.message).toBe('invalid_resolution')
    }
    expect(await reviewOf(pet.petId)).toMatchObject({ pending_kind: 'new' })
  })
})

describeDb('dar de baja', () => {
  // Covers: FR-012, FR-027, FR-029, US4-AS2, US4-AS3
  it('sale del listado y del enlace en el momento, y su publicador ve el motivo sin quién', async () => {
    const reviewer = await admin()
    const window = futureWindow()
    const owner = await publisher()
    const pet = await listPet(owner.id, { publishedAt: window.at(1) })
    const since = String((await reviewOf(pet.petId))?.pending_since)
    const tokenHash = 'a'.repeat(48) + crypto.randomUUID().replaceAll('-', '').slice(0, 16)
    const link = await serviceClient().rpc('create_pet_renewal_link', {
      p_pet: pet.petId,
      p_token_hash: tokenHash,
    })
    expect(link.error).toBeNull()
    const coverBefore = await db().rpc('renewal_link_view', { p_token_hash: tokenHash })
    expect(coverBefore.data?.[0]).toMatchObject({
      cover_id: pet.photoIds[0],
      cover_owner: owner.id,
    })
    // Lo publicado fuera de la ventana (otras pruebas, un e2e anterior) también sale: se mira el
    // código y la cuenta de la ventana, no la lista entera.
    expect((await listedAfter(anonClient(), window)).map((row) => row.code)).toContain(pet.code)
    expect(await countedInWindow(anonClient(), window)).toBe(1)

    const decision = await resolve(
      reviewer.id,
      pet.petId,
      since,
      'taken_down',
      'other',
      '  Tel. en la foto  ',
    )
    expect(decision).toBe('taken_down')

    expect((await listedAfter(anonClient(), window)).map((row) => row.code)).not.toContain(pet.code)
    expect(await countedInWindow(anonClient(), window)).toBe(0)
    const byCode = await anonClient().rpc('pet_by_code', { p_code: pet.code })
    expect(byCode.data).toEqual([])
    // El «Sigue disponible» de antes de la baja no la renueva y dice que fue dada de baja (US3-AS5).
    const renewal = await db().rpc('renew_by_link', {
      p_token_hash: tokenHash,
      p_pending_ttl: PENDING_TTL,
    })
    expect(renewal.data?.[0]?.outcome).toBe('taken_down')
    const stillDown = await db().from('pets').select('taken_down_at').eq('id', pet.petId).single()
    expect(stillDown.data?.taken_down_at).not.toBeNull()
    // El enlace sigue sirviendo para decirlo, pero la foto quitada ya no sale por él (FR-012).
    const coverAfter = await db().rpc('renewal_link_view', { p_token_hash: tokenHash })
    expect(coverAfter.data).toEqual([
      expect.objectContaining({ state: 'taken_down', cover_id: null, cover_owner: null }),
    ])

    const own = await owner.client
      .from('pets')
      .select('takedown_reason, takedown_note, taken_down_at')
      .eq('id', pet.petId)
      .single()
    expect(own.data).toMatchObject({ takedown_reason: 'other', takedown_note: 'Tel. en la foto' })
    expect(own.data?.taken_down_at).not.toBeNull()
    const who = await owner.client.from('pet_reviews').select('resolved_by').eq('pet_id', pet.petId)
    expect(who.data).toEqual([])
  })

  // Covers: FR-024, FR-012, spec §Assumptions (las fotos solo mientras espera)
  it('las fotos de una que espera se firman para quien administra, y después de revisada no', async () => {
    const reviewer = await admin()
    const other = await stranger()
    const pet = await pendingPet('none', { upload: true })
    const photo = `${pet.owner.id}/${pet.photoIds[1]}/card.webp`
    const avatar = `${pet.owner.id}/avatar.webp`
    const sign = (client: Client, bucket: string, path: string) =>
      client.storage.from(bucket).createSignedUrl(path, 60)

    expect((await sign(reviewer.client, 'pet-photos', photo)).error).toBeNull()
    expect((await sign(reviewer.client, 'avatars', avatar)).error).toBeNull()
    for (const client of [other.client, anonClient()]) {
      // oxlint-disable-next-line no-await-in-loop
      expect((await sign(client, 'pet-photos', photo)).data).toBeNull()
      // oxlint-disable-next-line no-await-in-loop
      expect((await sign(client, 'avatars', avatar)).data).toBeNull()
    }

    expect(await resolve(reviewer.id, pet.petId, pet.since, 'reviewed')).toBe('reviewed')
    expect((await sign(reviewer.client, 'pet-photos', photo)).data).toBeNull()
    // La foto de perfil, en cambio, quien administra la firma siempre: la muestra la ficha de la
    // persona (historia #73, research R10). Para nadie más cambia.
    expect((await sign(reviewer.client, 'avatars', avatar)).error).toBeNull()
    expect((await sign(other.client, 'avatars', avatar)).data).toBeNull()
  })
})

// Una camada es una sola entrada (historia #205, US5): entra entera, vuelve al editarla, y su baja
// pasa a cada cría.

async function litterReviewOf(litterId: string) {
  const { data, error } = await db()
    .from('pet_reviews')
    .select('*')
    .eq('litter_id', litterId)
    .maybeSingle()
  expect(error).toBeNull()
  return data
}

async function resolveLitter(
  adminId: string,
  litterId: string,
  knownSince: string,
  outcome: 'reviewed' | 'taken_down',
  reason?: string,
  note?: string,
) {
  const { data, error } = await serviceClient().rpc('resolve_litter_review', {
    p_admin: adminId,
    p_litter: litterId,
    p_known_since: knownSince,
    p_outcome: outcome,
    ...(reason === undefined ? {} : { p_reason: reason }),
    ...(note === undefined ? {} : { p_note: note }),
  })
  expect(error).toBeNull()
  const rows: { decision: string }[] = data ?? []
  return rows[0]?.decision
}

/** Una camada de 4 crías con 2 fotos; la segunda cría tiene una foto propia. */
async function pendingLitter(options: { upload?: boolean } = {}) {
  const owner = await publisher({ avatar: true })
  const photos = await stagedPhotos(owner.id, 3)
  if (options.upload) await Promise.all(photos.map((id) => uploadObjects(owner.id, id)))
  const young = youngList(4)
  young[1].description = 'La más chica.'
  young[1].photo_ids = photos.slice(2)
  const { row, error } = await publishLitter(owner.id, photos.slice(0, 2), young)
  expect(error).toBeNull()
  const litter = firstRow(row ? [row] : [], 'publish_litter')
  const review = await litterReviewOf(litter.litter_id)
  return {
    owner,
    litterId: litter.litter_id,
    code: litter.code,
    litterPhotos: photos.slice(0, 2),
    youngPhoto: photos[2],
    since: String(review?.pending_since),
  }
}

describeDb('una camada en la lista', () => {
  // Covers: FR-043, US5-AS1
  it('entra una sola vez como nueva, con lo común, sus fotos y cada cría con lo suyo', async () => {
    const reviewer = await admin()
    const litter = await pendingLitter()
    await db()
      .from('pet_reviews')
      .update({ pending_since: pastWindow()(0) })
      .eq('litter_id', litter.litterId)

    const review = await litterReviewOf(litter.litterId)
    expect(review).toMatchObject({ pet_id: null, pending_kind: 'new', outcome: null })
    const young = await youngOf(litter.litterId)
    const youngReviews = await db()
      .from('pet_reviews')
      .select('pet_id')
      .in(
        'pet_id',
        young.map((one) => one.id),
      )
    expect(youngReviews.data).toEqual([])

    const { rows, error } = await queue(reviewer.client)
    expect(error).toBeNull()
    const mine = rows.filter(
      (row) => row.litter_id === litter.litterId || young.some((one) => one.id === row.pet_id),
    )
    expect(mine).toHaveLength(1)
    expect(rows[0]).toBe(mine[0])
    expect(mine[0]).toMatchObject({
      kind: 'litter',
      pet_id: null,
      code: litter.code,
      name: 'La camada de Luna',
      sex: null,
      state: 'available',
      pending_kind: 'new',
      is_own: false,
      publisher_level: 1,
      photos: litter.litterPhotos.map((id) => expect.objectContaining({ id })),
    })
    const own = young.map((one) => ({ id: one.id, name: one.name, sex: one.sex }))
    expect(mine[0].young).toEqual([
      { ...own[0], description: null, photos: [] },
      {
        ...own[1],
        description: 'La más chica.',
        photos: [expect.objectContaining({ id: litter.youngPhoto })],
      },
      { ...own[2], description: null, photos: [] },
      { ...own[3], description: null, photos: [] },
    ])
    const text = JSON.stringify(mine[0])
    const secrets = [litter.owner.profileLocality, litter.owner.email, litter.owner.phone]
    for (const secret of secrets.filter((value) => value !== null)) {
      expect(text).not.toContain(secret)
    }
  })

  // Covers: FR-045, US5-AS2
  it('revisada, editarla o sumarle una cría la vuelve como editada', async () => {
    const reviewer = await admin()
    const litter = await pendingLitter()
    expect(await resolveLitter(reviewer.id, litter.litterId, litter.since, 'reviewed')).toBe(
      'reviewed',
    )
    expect(await litterReviewOf(litter.litterId)).toMatchObject({
      pending_since: null,
      outcome: 'reviewed',
      resolved_by: reviewer.id,
    })

    const saved = await savedYoungOf(litter.litterId)
    const [added] = youngList(1, [{ name: 'Cría nueva' }])
    expect(
      (await saveLitter(litter.owner.id, litter.litterId, litter.litterPhotos, [...saved, added]))
        .error,
    ).toBeNull()
    const again = await litterReviewOf(litter.litterId)
    expect(again).toMatchObject({ pending_kind: 'edited', outcome: 'reviewed' })

    // Mientras espera, otra edición no la mueve.
    expect(
      (await saveLitter(litter.owner.id, litter.litterId, litter.litterPhotos, saved)).error,
    ).toBeNull()
    expect(await litterReviewOf(litter.litterId)).toEqual(again)
  })

  // Covers: FR-044, US5-AS3
  it('darla de baja pasa a cada cría, cierra sus solicitudes y la saca del listado', async () => {
    const reviewer = await admin()
    const window = futureWindow()
    const owner = await publisher()
    const listed = await listLitter(owner.id, window.at(1), youngList(2))
    const since = String((await litterReviewOf(listed.litterId))?.pending_since)
    const young = await youngOf(listed.litterId)
    const maria = await people.person(1)
    expect((await submit(maria, young[0].code)).outcome).toBe('sent')
    expect((await listedAfter(anonClient(), window)).map((row) => row.code)).toContain(listed.code)

    expect(
      await resolveLitter(
        reviewer.id,
        listed.litterId,
        since,
        'taken_down',
        'other',
        '  Tel. en la foto  ',
      ),
    ).toBe('taken_down')

    expect((await listedAfter(anonClient(), window)).map((row) => row.code)).not.toContain(
      listed.code,
    )
    expect((await anonClient().rpc('litter_by_code', { p_code: listed.code })).data).toEqual([])
    for (const one of await youngOf(listed.litterId)) {
      expect(one).toMatchObject({ takedown_reason: 'other', takedown_note: 'Tel. en la foto' })
      expect(one.taken_down_at).not.toBeNull()
    }
    const [application] = await applicationsOf(maria.id)
    expect(application).toMatchObject({ status: 'closed', close_reason: 'unpublished' })

    const own = await owner.client
      .from('litters')
      .select('takedown_reason, takedown_note, taken_down_at')
      .eq('id', listed.litterId)
      .single()
    expect(own.data).toMatchObject({ takedown_reason: 'other', takedown_note: 'Tel. en la foto' })
    expect(own.data?.taken_down_at).not.toBeNull()
    const who = await owner.client
      .from('pet_reviews')
      .select('resolved_by')
      .eq('litter_id', listed.litterId)
    expect(who.data).toEqual([])
    const { rows } = await queue(reviewer.client)
    expect(rows.map((row) => row.litter_id)).not.toContain(listed.litterId)
  })

  // Covers: FR-044 (con las reglas de #59: la propia, dos que administran, la que ya no está)
  it('la propia no se resuelve, la segunda que administra ve que ya se resolvió', async () => {
    const first = await admin()
    const second = await admin()
    const litter = await pendingLitter()
    await levelOne(first.id)
    const own = await publishLitter(first.id, await stagedPhotos(first.id, 1), youngList(2))
    expect(own.error).toBeNull()
    const ownId = own.row?.litter_id ?? ''
    const ownSince = String((await litterReviewOf(ownId))?.pending_since)
    expect(await resolveLitter(first.id, ownId, ownSince, 'reviewed')).toBe('own')

    expect(await resolveLitter(first.id, litter.litterId, litter.since, 'reviewed')).toBe(
      'reviewed',
    )
    expect(
      await resolveLitter(second.id, litter.litterId, litter.since, 'taken_down', 'sale_or_money'),
    ).toBe('closed')
    expect((await litterReviewOf(litter.litterId))?.outcome).toBe('reviewed')

    const deleted = await serviceClient().rpc('delete_litter', {
      p_owner: litter.owner.id,
      p_litter: litter.litterId,
    })
    expect(deleted.error).toBeNull()
    expect(await litterReviewOf(litter.litterId)).toBeNull()
    expect(await resolveLitter(second.id, litter.litterId, litter.since, 'reviewed')).toBe('gone')
  })

  // Covers: FR-043, FR-023 de #59 (solo quien administra, y las fotos solo mientras espera)
  it('quien no administra no la lee; sus fotos y las de sus crías se firman solo para revisarla', async () => {
    const reviewer = await admin()
    const other = await stranger()
    const litter = await pendingLitter({ upload: true })
    // Sin nivel 1 la camada no está a la vista: solo la revisión puede firmar sus fotos.
    await setPhone(litter.owner.id, 'none')
    const paths = [litter.litterPhotos[1], litter.youngPhoto].map(
      (id) => `${litter.owner.id}/${id}/card.webp`,
    )
    const sign = (client: Client, path: string) =>
      client.storage.from('pet-photos').createSignedUrl(path, 60)

    for (const client of [other.client, litter.owner.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const read = await client.from('pet_reviews').select('*').eq('litter_id', litter.litterId)
      expect(read).toMatchObject({ data: [], error: null })
    }
    expect(await queue(other.client)).toEqual({ rows: [], error: null })

    for (const path of paths) {
      // oxlint-disable-next-line no-await-in-loop
      expect((await sign(reviewer.client, path)).error).toBeNull()
      for (const client of [other.client, anonClient()]) {
        // oxlint-disable-next-line no-await-in-loop
        expect((await sign(client, path)).data).toBeNull()
      }
    }

    expect(await resolveLitter(reviewer.id, litter.litterId, litter.since, 'reviewed')).toBe(
      'reviewed',
    )
    for (const path of paths) {
      // oxlint-disable-next-line no-await-in-loop
      expect((await sign(reviewer.client, path)).data).toBeNull()
    }
  })
})
