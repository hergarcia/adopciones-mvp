// Los animales en la base (historia #53): lo que nadie más ve, lo que nadie escribe desde el
// cliente, y las reglas que viven en las funciones porque tienen consecuencias —el nivel 1, las
// fotos en espera, un intento que publica una sola vez—, incluidas las carreras que las justifican.
// La base local solo tiene datos sintéticos.
import { afterEach, beforeEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { agePending, clearSends, db, hoursAgo } from './phone-support'
import {
  BUCKET,
  FIELDS,
  STAGED_TTL,
  ageStaged,
  hasLevelOne,
  levelOne,
  objectsOf,
  petsOf,
  photosOf,
  publish,
  published,
  save,
  stage,
  stagedPhotos,
  startChange,
  uploadObjects,
  webp,
} from './pet-support'
import { deletePetPhotosAsService } from '../../src/lib/supabase/queries/pet-photos'
import { anonClient, asNewUser, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []

beforeEach(clearSends)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
  await clearSends()
})

async function person(): Promise<SyntheticUser> {
  const user = await asNewUser()
  cleanups.push(user.cleanup)
  return user
}

async function anaWithPet() {
  const ana = await person()
  await levelOne(ana.id)
  const pet = await published(ana.id, 2)
  await uploadObjects(ana.id, pet.photoIds[0])
  return { ana, ...pet, path: `${ana.id}/${pet.photoIds[0]}/card.webp` }
}

describeDb('un animal, lo que no se ve', () => {
  // Covers: FR-005, SC-005
  it('la dueña ve sus filas; nadie más, con o sin sesión', async () => {
    const { ana, petId } = await anaWithPet()
    const juan = await person()

    const own = await ana.client.from('pets').select('id').eq('id', petId)
    expect(own.data).toEqual([{ id: petId }])
    const ownPhotos = await ana.client.from('pet_photos').select('id').eq('pet_id', petId)
    expect(ownPhotos.data).toHaveLength(2)

    for (const client of [anonClient(), juan.client]) {
      // oxlint-disable-next-line no-await-in-loop -- dos roles, uno detrás del otro
      const pets = await client.from('pets').select('*').eq('id', petId)
      expect(pets.data ?? []).toEqual([])
      // oxlint-disable-next-line no-await-in-loop
      const photos = await client.from('pet_photos').select('*').eq('pet_id', petId)
      expect(photos.data ?? []).toEqual([])
    }
  })

  // Covers: FR-005, SC-005
  it('una foto no se baja sin sesión ni con la de otra persona, aunque se sepa la dirección', async () => {
    const { ana, path } = await anaWithPet()
    const juan = await person()

    const own = await ana.client.storage.from(BUCKET).download(path)
    expect(own.error).toBeNull()

    for (const client of [anonClient(), juan.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const { data, error } = await client.storage.from(BUCKET).download(path)
      expect(data).toBeNull()
      expect(error).not.toBeNull()
    }
  })

  // Covers: FR-005
  it('la dueña firma la dirección de su foto; otra persona no puede firmar la ajena', async () => {
    const { ana, path } = await anaWithPet()
    const juan = await person()

    const own = await ana.client.storage.from(BUCKET).createSignedUrl(path, 60)
    expect(own.data?.signedUrl).toBeTruthy()

    const other = await juan.client.storage.from(BUCKET).createSignedUrl(path, 60)
    expect(other.data?.signedUrl ?? null).toBeNull()
    expect(other.error).not.toBeNull()
  })
})

describeDb('un animal, lo que nadie escribe desde el cliente', () => {
  // Covers: FR-001, FR-005, research R1 y R5
  it('ni la dueña, ni otra persona, ni sin sesión insertan, cambian o borran filas', async () => {
    const { ana, petId, photoIds } = await anaWithPet()
    const juan = await person()

    const attempts = [anonClient(), juan.client, ana.client].map(async (client) => {
      const insertPet = await client
        .from('pets')
        .insert({ ...FIELDS, owner_id: ana.id, attempt_id: crypto.randomUUID() })
      expect(insertPet.error).not.toBeNull()
      const insertPhoto = await client.from('pet_photos').insert({
        id: crypto.randomUUID(),
        owner_id: ana.id,
        width: 1,
        height: 1,
        thumbhash: 'x',
      })
      expect(insertPhoto.error).not.toBeNull()
      await client.from('pets').update({ name: 'Otra' }).eq('id', petId)
      await client.from('pets').delete().eq('id', petId)
      await client.from('pet_photos').update({ position: 4 }).eq('id', photoIds[0])
      await client.from('pet_photos').delete().eq('id', photoIds[0])
    })
    await Promise.all(attempts)

    const [pet] = await petsOf(ana.id)
    expect(pet.name).toBe('Luna')
    expect(await photosOf(ana.id)).toEqual([
      { id: photoIds[0], pet_id: petId, position: 0, released_at: null },
      { id: photoIds[1], pet_id: petId, position: 1, released_at: null },
    ])
  })

  // Covers: FR-001, FR-005
  it('nadie ejecuta las funciones de los animales desde el cliente', async () => {
    const ana = await person()
    await levelOne(ana.id)
    const calls = [
      ['has_level_one', { p_user: ana.id, p_pending_ttl: '7 days' }],
      ['purge_pet_photos', { p_staged_ttl: '24 hours' }],
      ['delete_pet_photo_rows', { p_ids: [crypto.randomUUID()] }],
    ] as const

    for (const client of [anonClient(), ana.client]) {
      for (const [name, args] of calls) {
        // oxlint-disable-next-line no-await-in-loop
        const { error } = await client.rpc(name, args)
        expect(error).not.toBeNull()
      }
      // oxlint-disable-next-line no-await-in-loop
      const staged = await client.rpc('stage_pet_photo', {
        p_owner: ana.id,
        p_photo_id: crypto.randomUUID(),
        p_width: 1,
        p_height: 1,
        p_thumbhash: 'x',
        p_pending_ttl: '7 days',
      })
      expect(staged.error).not.toBeNull()
      // oxlint-disable-next-line no-await-in-loop
      const publishing = await client.rpc('publish_pet', {
        p_owner: ana.id,
        p_attempt: crypto.randomUUID(),
        p_pending_ttl: '7 days',
        p_staged_ttl: '24 hours',
        p_fields: FIELDS,
        p_photo_ids: [],
      })
      expect(publishing.error).not.toBeNull()
    }
    expect(await petsOf(ana.id)).toEqual([])
    expect(await photosOf(ana.id)).toEqual([])
  })

  // Covers: FR-001, FR-005
  it('nadie reescribe un animal con la función de guardar, ni ajeno ni propio', async () => {
    const { ana, petId, photoIds } = await anaWithPet()
    const juan = await person()

    for (const client of [anonClient(), juan.client, ana.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const saving = await client.rpc('save_pet', {
        p_owner: ana.id,
        p_pet: petId,
        p_pending_ttl: '7 days',
        p_staged_ttl: '24 hours',
        p_fields: { ...FIELDS, name: 'Otra' },
        p_photo_ids: [photoIds[1]],
      })
      expect(saving.error?.code).toBe('42501')
    }

    const [pet] = await petsOf(ana.id)
    expect(pet.name).toBe('Luna')
    expect(await photosOf(ana.id)).toEqual([
      { id: photoIds[0], pet_id: petId, position: 0, released_at: null },
      { id: photoIds[1], pet_id: petId, position: 1, released_at: null },
    ])
  })

  // Covers: FR-005, research R1
  it('nadie sube, pisa ni borra objetos: tampoco la dueña en su carpeta', async () => {
    const { ana, path } = await anaWithPet()
    const juan = await person()

    for (const client of [anonClient(), juan.client, ana.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const own = await client.storage
        .from(BUCKET)
        .upload(`${ana.id}/${crypto.randomUUID()}/card.webp`, webp(), { contentType: 'image/webp' })
      expect(own.error).not.toBeNull()
      // oxlint-disable-next-line no-await-in-loop
      const overwrite = await client.storage
        .from(BUCKET)
        .upload(path, webp(), { contentType: 'image/webp', upsert: true })
      expect(overwrite.error).not.toBeNull()
      // oxlint-disable-next-line no-await-in-loop
      await client.storage.from(BUCKET).remove([path])
    }

    const still = await serviceClient().storage.from(BUCKET).download(path)
    expect(still.error).toBeNull()
  })
})

describeDb('el nivel 1 en la base', () => {
  // Covers: FR-001 (la misma regla que phoneStatus + isLevelOne)
  it('sin teléfono no; verificado sí; con un cambio a medias vivo no; vencido, vuelve', async () => {
    const ana = await person()
    expect(await hasLevelOne(ana.id)).toBe(false)

    await levelOne(ana.id)
    expect(await hasLevelOne(ana.id)).toBe(true)

    await startChange(ana.id)
    expect(await hasLevelOne(ana.id)).toBe(false)

    await db()
      .from('phones')
      .update({ pending_since: new Date(Date.now() - 7 * 86_400_000 + 60_000).toISOString() })
      .eq('user_id', ana.id)
    expect(await hasLevelOne(ana.id)).toBe(false)

    await agePending(ana.id, 7.001)
    expect(await hasLevelOne(ana.id)).toBe(true)
  })

  // Covers: FR-001, US1-AS10 (número perdido)
  it('con el número perdido no', async () => {
    const ana = await person()
    await db().from('phones').insert({ user_id: ana.id, number_lost_on: '2026-09-20' })
    expect(await hasLevelOne(ana.id)).toBe(false)
  })
})

describeDb('una foto en espera', () => {
  // Covers: FR-001
  it('sin nivel 1 no se anota', async () => {
    const ana = await person()
    const { error } = await stage(ana.id)
    expect(error?.message).toBe('needs_verification')
    expect(await photosOf(ana.id)).toEqual([])
  })

  // Covers: FR-005, research R1
  it('con el id de una foto de otra persona, photo_taken y no cambia de dueña', async () => {
    const ana = await person()
    const juan = await person()
    await levelOne(ana.id)
    await levelOne(juan.id)
    const [photoId] = await stagedPhotos(ana.id, 1)

    const { error } = await stage(juan.id, photoId)
    expect(error?.message).toBe('photo_taken')
    expect(await photosOf(ana.id)).toHaveLength(1)
    expect(await photosOf(juan.id)).toEqual([])
  })

  // Covers: FR-018, FR-021 (el reintento de una subida)
  it('el mismo id dos veces deja una sola fila', async () => {
    const ana = await person()
    await levelOne(ana.id)
    const [photoId] = await stagedPhotos(ana.id, 1)

    const again = await stage(ana.id, photoId)
    expect(again.error).toBeNull()
    expect(await photosOf(ana.id)).toHaveLength(1)
  })
})

describeDb('publicar', () => {
  // Covers: US1-AS1, US1-AS3, FR-012, FR-015
  it('con nivel 1 publica disponible y engancha las fotos en el orden mandado', async () => {
    const ana = await person()
    await levelOne(ana.id)
    const [a, b, c] = await stagedPhotos(ana.id, 3)

    const { row, error } = await publish(ana.id, [b, a, c])
    expect(error).toBeNull()
    expect(row?.already).toBe(false)

    const [pet] = await petsOf(ana.id)
    expect(pet.id).toBe(row?.pet_id)
    expect(pet.status).toBe('available')
    expect(pet.language).toBe('es')
    expect(await photosOf(ana.id)).toEqual([
      { id: b, pet_id: pet.id, position: 0, released_at: null },
      { id: a, pet_id: pet.id, position: 1, released_at: null },
      { id: c, pet_id: pet.id, position: 2, released_at: null },
    ])
  })

  // Covers: US1-AS10, FR-001, FR-023
  it('sin teléfono, con un cambio a medias o con el número perdido: needs_verification', async () => {
    const nunca = await person()
    const aMedias = await person()
    const perdido = await person()
    await levelOne(aMedias.id)
    const staged = await stagedPhotos(aMedias.id, 1)
    await startChange(aMedias.id)
    await db().from('phones').insert({ user_id: perdido.id, number_lost_on: '2026-09-20' })

    expect((await publish(nunca.id, [])).error?.message).toBe('needs_verification')
    expect((await publish(aMedias.id, staged)).error?.message).toBe('needs_verification')
    expect((await publish(perdido.id, [])).error?.message).toBe('needs_verification')
    expect(await petsOf(aMedias.id)).toEqual([])
  })

  // Covers: US1-AS13, US3-AS2, FR-018, SC-004
  it('el mismo intento dos veces en paralelo deja una sola publicación', async () => {
    const ana = await person()
    await levelOne(ana.id)
    const ids = await stagedPhotos(ana.id, 2)
    const attempt = crypto.randomUUID()

    const results = await Promise.all([
      publish(ana.id, ids, { attempt }),
      publish(ana.id, ids, { attempt }),
    ])
    expect(results.map((result) => result.error)).toEqual([null, null])
    expect(new Set(results.map((result) => result.row?.already))).toEqual(new Set([false, true]))
    expect(results[0].row?.pet_id).toBe(results[1].row?.pet_id)
    expect(await petsOf(ana.id)).toHaveLength(1)
  })

  // Covers: FR-018 (el intento gana sobre cualquier otra comprobación)
  it('un reintento de un intento publicado termina como él aunque ya no tenga nivel 1', async () => {
    const ana = await person()
    await levelOne(ana.id)
    const ids = await stagedPhotos(ana.id, 1)
    const attempt = crypto.randomUUID()
    const first = await publish(ana.id, ids, { attempt })
    await startChange(ana.id)

    const retry = await publish(ana.id, [], { attempt })
    expect(retry.error).toBeNull()
    expect(retry.row).toEqual({ pet_id: first.row?.pet_id, already: true })
  })

  // Covers: FR-006, FR-015, research R1
  it('0 y 6 fotos, una ajena, una ya enganchada o una vencida: photos_invalid', async () => {
    const ana = await person()
    const juan = await person()
    await levelOne(ana.id)
    await levelOne(juan.id)
    const six = await stagedPhotos(ana.id, 6)
    const [foreign] = await stagedPhotos(juan.id, 1)
    const { photoIds: attached } = await published(ana.id, 1)
    const [stale] = await stagedPhotos(ana.id, 1)
    await ageStaged(stale, 24.01)

    for (const ids of [
      [],
      six,
      [six[0], foreign],
      [six[0], attached[0]],
      [stale],
      [six[0], six[0]],
    ]) {
      // oxlint-disable-next-line no-await-in-loop
      const { error } = await publish(ana.id, ids)
      expect(error?.message).toBe('photos_invalid')
    }
    expect(await petsOf(ana.id)).toHaveLength(1)
  })

  // Covers: research R1 (una foto a punto de vencer todavía entra)
  it('una foto en espera más nueva que el TTL entra', async () => {
    const ana = await person()
    await levelOne(ana.id)
    const [photoId] = await stagedPhotos(ana.id, 1)
    await db()
      .from('pet_photos')
      .update({ staged_at: hoursAgo(23.9) })
      .eq('id', photoId)

    const { error } = await publish(ana.id, [photoId])
    expect(error).toBeNull()
  })
})

describeDb('guardar una edición', () => {
  // Covers: US2-AS4, FR-005
  it('el animal de otra persona es not_found y no cambia', async () => {
    const { ana, petId, photoIds } = await anaWithPet()
    const juan = await person()
    await levelOne(juan.id)

    const { error } = await save(juan.id, petId, photoIds, { name: 'Robada' })
    expect(error?.message).toBe('not_found')
    expect((await petsOf(ana.id))[0].name).toBe('Luna')
  })

  // Covers: US2-AS5, FR-001, FR-004
  it('sin nivel 1 es needs_verification y el animal sigue igual', async () => {
    const { ana, petId, photoIds } = await anaWithPet()
    await startChange(ana.id)

    const { error } = await save(ana.id, petId, photoIds, { name: 'Otra' })
    expect(error?.message).toBe('needs_verification')
    expect((await petsOf(ana.id))[0].name).toBe('Luna')
  })

  // Covers: US2-AS1, US2-AS7, FR-012, FR-019, FR-020
  it('reordena, saca y agrega en una sola llamada, y no cambia la fecha de publicación', async () => {
    const { ana, petId, photoIds } = await anaWithPet()
    const [before] = await petsOf(ana.id)
    const [added] = await stagedPhotos(ana.id, 1)

    const { data, error } = await save(ana.id, petId, [added, photoIds[1]], {
      description: 'Castrada',
    })
    expect(error).toBeNull()
    expect(data).toEqual([photoIds[0]])

    const [after] = await petsOf(ana.id)
    expect(after.description).toBe('Castrada')
    expect(after.published_at).toBe(before.published_at)
    const photos = await photosOf(ana.id)
    expect(photos.filter((photo) => photo.pet_id === petId)).toEqual([
      { id: added, pet_id: petId, position: 0, released_at: null },
      { id: photoIds[1], pet_id: petId, position: 1, released_at: null },
    ])
    const released = photos.find((photo) => photo.id === photoIds[0])
    expect(released?.pet_id).toBeNull()
    expect(released?.released_at).not.toBeNull()
  })

  // Covers: FR-020a
  it('una foto que otra pestaña ya sacó: changed_elsewhere y no se guarda nada', async () => {
    const { ana, petId, photoIds } = await anaWithPet()
    const other = await save(ana.id, petId, [photoIds[1]])
    expect(other.error).toBeNull()

    const { error } = await save(ana.id, petId, photoIds, { name: 'Otra' })
    expect(error?.message).toBe('changed_elsewhere')
    expect((await petsOf(ana.id))[0].name).toBe('Luna')
  })

  // Covers: FR-006, US2-AS3
  it('sin fotos, con 6 o con una en espera vencida no se guarda', async () => {
    const { ana, petId, photoIds } = await anaWithPet()
    const six = await stagedPhotos(ana.id, 4)
    const [stale] = await stagedPhotos(ana.id, 1)
    await ageStaged(stale, 24.01)

    expect((await save(ana.id, petId, [])).error?.message).toBe('photos_invalid')
    expect((await save(ana.id, petId, [...photoIds, ...six])).error?.message).toBe('photos_invalid')
    expect((await save(ana.id, petId, [photoIds[0], stale])).error?.message).toBe('photos_invalid')
    expect((await photosOf(ana.id)).filter((photo) => photo.pet_id === petId)).toHaveLength(2)
  })
})

describeDb('borrar la cuenta con animales', () => {
  // Covers: FR-027, SC-007, research R20
  it('el barrido deja la carpeta vacía, también un objeto sin fila, y la cascada se lleva todo', async () => {
    const { ana, photoIds } = await anaWithPet()
    const [staged] = await stagedPhotos(ana.id, 1)
    await uploadObjects(ana.id, staged)
    await uploadObjects(ana.id, crypto.randomUUID())
    await uploadObjects(ana.id, photoIds[1])
    expect(await objectsOf(ana.id)).toHaveLength(12)

    expect(await deletePetPhotosAsService(ana.id)).toEqual({ ok: true })
    expect(await objectsOf(ana.id)).toEqual([])

    await serviceClient().auth.admin.deleteUser(ana.id)
    expect(await petsOf(ana.id)).toEqual([])
    expect(await photosOf(ana.id)).toEqual([])
  })
})

describeDb('la purga', () => {
  // Covers: FR-020, research R13
  it('devuelve las en espera de más de 24 horas y las soltadas; nunca las publicadas', async () => {
    const { ana, petId, photoIds } = await anaWithPet()
    const [fresh, stale] = await stagedPhotos(ana.id, 2)
    await ageStaged(stale, 24.01)
    expect((await save(ana.id, petId, [photoIds[0]])).error).toBeNull()

    const { data, error } = await serviceClient().rpc('purge_pet_photos', {
      p_staged_ttl: STAGED_TTL,
    })
    expect(error).toBeNull()
    const mine = (data ?? []).filter((row: { owner_id: string }) => row.owner_id === ana.id)
    expect(new Set(mine.map((row: { id: string }) => row.id))).toEqual(
      new Set([stale, photoIds[1]]),
    )
    expect(mine.some((row: { id: string }) => row.id === fresh)).toBe(false)

    const removed = await serviceClient().rpc('delete_pet_photo_rows', {
      p_ids: [stale, photoIds[1], photoIds[0]],
    })
    expect(removed.error).toBeNull()
    const left = (await photosOf(ana.id)).map((photo) => photo.id)
    expect(new Set(left)).toEqual(new Set([photoIds[0], fresh]))
  })
})
