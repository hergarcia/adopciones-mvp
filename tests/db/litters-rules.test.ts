// Las reglas de una camada que viven en la base (historia #205): publicar en una transacción e
// idempotente, de 2 a 10 crías sin nombres repetidos, la fecha de entrega, el nivel 1 y las fotos en
// espera; las crías nacen con lo común copiado y las funciones del ciclo de vida de un animal no las
// tocan. La base local solo tiene datos sintéticos.
import { afterEach, beforeEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { uruguayDay } from '../../src/lib/pets/age'
import {
  LITTER_FIELDS,
  littersOf,
  publishLitter,
  publishedLitter,
  youngList,
  youngOf,
} from './litter-support'
import { clearSends, db } from './phone-support'
import {
  PENDING_TTL,
  levelOne,
  photosOf,
  publish,
  save,
  stagedPhotos,
  startChange,
} from './pet-support'
import { asNewUser, serviceClient, type SyntheticUser } from './roles'

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

async function publisher() {
  const ana = await person()
  await levelOne(ana.id)
  return ana
}

const day = (offset: number) => uruguayDay(new Date(Date.now() + offset * 86_400_000))

describeDb('publicar una camada', () => {
  // Covers: US1-AS3, FR-004, FR-006, FR-014, R1, R2
  it('la camada y sus crías, con lo común copiado, disponibles y sin vencimiento', async () => {
    const ana = await publisher()
    const photos = await stagedPhotos(ana.id, 3)
    const young = youngList(3)
    young[1].description = 'La más chica.'
    young[2].photo_ids = photos.slice(2)
    const { row, error } = await publishLitter(ana.id, photos.slice(0, 2), young, {
      fields: { required_level: 2, is_urgent: true, delivers_from: day(3) },
    })
    expect(error).toBeNull()
    expect(row?.already).toBe(false)
    expect(row?.code).toMatch(/^[0-9a-hjkmnp-tv-z]{10}$/)

    const [litter] = await littersOf(ana.id)
    expect(litter).toMatchObject({
      id: row?.litter_id,
      code: row?.code,
      name: 'La camada de Luna',
      species: 'cat',
      locality: 'Pocitos',
      required_level: 2,
      is_urgent: true,
      delivers_from: day(3),
      taken_down_at: null,
    })

    const pets = await youngOf(litter.id)
    expect(pets.map((pet) => [pet.name, pet.sex, pet.description])).toEqual([
      ['Cría 1', 'female', null],
      ['Cría 2', 'male', 'La más chica.'],
      ['Cría 3', 'female', null],
    ])
    for (const pet of pets) {
      expect(pet).toMatchObject({
        owner_id: ana.id,
        species: 'cat',
        size: LITTER_FIELDS.size,
        age_value: LITTER_FIELDS.age_value,
        age_unit: LITTER_FIELDS.age_unit,
        vaccines: LITTER_FIELDS.vaccines,
        good_with_cats: LITTER_FIELDS.good_with_cats,
        department: 'UY-MO',
        locality: 'Pocitos',
        is_urgent: true,
        required_level: 2,
        status: 'available',
        expires_at: 'infinity',
      })
    }
    expect(pets.map((pet) => pet.attempt_id)).toEqual(young.map((one) => one.key))

    const attached = await photosOf(ana.id)
    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)
    expect(
      attached.map(({ id, pet_id, position }) => ({ id, pet_id, position })).sort(byId),
    ).toEqual(
      [
        { id: photos[0], pet_id: null, position: 0 },
        { id: photos[1], pet_id: null, position: 1 },
        { id: photos[2], pet_id: pets[2].id, position: 0 },
      ].sort(byId),
    )
    const { data: litterPhotos } = await db()
      .from('pet_photos')
      .select('id')
      .eq('litter_id', litter.id)
      .order('position')
    expect(litterPhotos?.map((photo) => photo.id)).toEqual(photos.slice(0, 2))
  })

  // Covers: US1-AS13, FR-016, SC-005
  it('el mismo intento dos veces es una camada, con sus crías una sola vez', async () => {
    const ana = await publisher()
    const photos = await stagedPhotos(ana.id, 1)
    const young = youngList(4)
    const attempt = crypto.randomUUID()
    const first = await publishLitter(ana.id, photos, young, { attempt })
    const second = await publishLitter(ana.id, photos, young, { attempt })
    expect(first.error).toBeNull()
    expect(second.error).toBeNull()
    expect(second.row).toEqual({ ...first.row, already: true })
    expect(await littersOf(ana.id)).toHaveLength(1)
    expect(await youngOf(first.row?.litter_id ?? '')).toHaveLength(4)
  })

  // Covers: FR-016
  it('una cría con la clave de otra fila no se crea dos veces', async () => {
    const ana = await publisher()
    const { young } = await publishedLitter(ana.id, 2)
    const photos = await stagedPhotos(ana.id, 1)
    const again = youngList(2, [{ key: young[0].key }])
    const { error } = await publishLitter(ana.id, photos, again)
    expect(error).not.toBeNull()
    expect(await littersOf(ana.id)).toHaveLength(1)
  })

  // Covers: US1-AS5, US1-AS6, FR-009
  it('una sola cría u once no se publican', async () => {
    const ana = await publisher()
    for (const count of [0, 1, 11]) {
      // oxlint-disable-next-line no-await-in-loop -- de a una, para ver cada rechazo
      const photos = await stagedPhotos(ana.id, 1)
      // oxlint-disable-next-line no-await-in-loop
      const { error } = await publishLitter(ana.id, photos, youngList(count))
      expect(error?.message).toBe('young_count')
    }
    expect(await littersOf(ana.id)).toEqual([])
  })

  // Covers: US1-AS8, FR-008
  it('dos crías con el mismo nombre, con otra mayúscula o espacios, no se publican', async () => {
    const ana = await publisher()
    const photos = await stagedPhotos(ana.id, 1)
    const young = youngList(3, [{ name: 'Cría 1' }, { name: ' cría 1 ' }])
    const { error } = await publishLitter(ana.id, photos, young)
    expect(error?.message).toBe('young_name_taken')
    expect(await littersOf(ana.id)).toEqual([])
  })

  // Covers: US1-AS10, FR-013 y el Edge Case «La fecha de entrega es hoy»
  it('la fecha de entrega de ayer se rechaza; la de hoy sirve', async () => {
    const ana = await publisher()
    const photos = await stagedPhotos(ana.id, 2)
    const past = await publishLitter(ana.id, photos.slice(0, 1), youngList(2), {
      fields: { delivers_from: day(-1) },
    })
    expect(past.error?.message).toBe('delivery_date_past')
    const today = await publishLitter(ana.id, photos.slice(1), youngList(2), {
      fields: { delivers_from: day(0) },
    })
    expect(today.error).toBeNull()
  })

  // Covers: US1-AS16, FR-002
  it('sin nivel 1 no se publica, también con un número a medias', async () => {
    const ana = await publisher()
    const photos = await stagedPhotos(ana.id, 1)
    await startChange(ana.id)
    const { error } = await publishLitter(ana.id, photos, youngList(2))
    expect(error?.message).toBe('needs_verification')
    expect(await littersOf(ana.id)).toEqual([])
  })

  // Covers: FR-011
  it('las fotos tienen que ser propias, en espera y no más de 5 por grupo', async () => {
    const ana = await publisher()
    const juan = await publisher()
    const mine = await stagedPhotos(ana.id, 7)
    const theirs = await stagedPhotos(juan.id, 1)

    const none = await publishLitter(ana.id, [], youngList(2))
    expect(none.error?.message).toBe('photos_invalid')
    const foreign = await publishLitter(ana.id, theirs, youngList(2))
    expect(foreign.error?.message).toBe('photos_invalid')
    const foreignYoung = await publishLitter(
      ana.id,
      mine.slice(0, 1),
      youngList(2, [{ photo_ids: theirs }]),
    )
    expect(foreignYoung.error?.message).toBe('photos_invalid')
    const six = await publishLitter(
      ana.id,
      mine.slice(0, 1),
      youngList(2, [{ photo_ids: mine.slice(1) }]),
    )
    expect(six.error?.message).toBe('photos_invalid')
    const repeated = await publishLitter(
      ana.id,
      mine.slice(0, 1),
      youngList(2, [{ photo_ids: mine.slice(0, 1) }]),
    )
    expect(repeated.error?.message).toBe('photos_invalid')
    expect(await littersOf(ana.id)).toEqual([])
  })

  // Covers: R7
  it('una foto de la camada no está en espera: ni un animal nuevo ni la purga la toman', async () => {
    const ana = await publisher()
    const { photoIds } = await publishedLitter(ana.id, 2)
    const taken = await publish(ana.id, photoIds)
    expect(taken.error?.message).toBe('photos_invalid')

    const { data, error } = await serviceClient().rpc('purge_pet_photos', {
      p_staged_ttl: '0 seconds',
    })
    expect(error).toBeNull()
    expect(data?.map((row: { id: string }) => row.id)).not.toContain(photoIds[0])
  })

  // Covers: FR-043 (la camada entra entera; sus crías no entran sueltas, R8)
  it('las crías no entran sueltas a la revisión', async () => {
    const ana = await publisher()
    const { litterId } = await publishedLitter(ana.id, 2)
    const ids = (await youngOf(litterId)).map((pet) => pet.id)
    const { data } = await db().from('pet_reviews').select('pet_id').in('pet_id', ids)
    expect(data).toEqual([])
  })
})

describeDb('una cría no tiene ciclo de vida propio (R2)', () => {
  async function aYoung() {
    const ana = await publisher()
    const { litterId } = await publishedLitter(ana.id, 2)
    const [young] = await youngOf(litterId)
    return { ana, young }
  }

  // Covers: R2
  it('no cambia de estado, no se renueva ni vuelve a publicarse', async () => {
    const { ana, young } = await aYoung()
    for (const action of ['pause', 'mark_in_process', 'renew', 'republish']) {
      // oxlint-disable-next-line no-await-in-loop -- una acción por vez
      const { error } = await serviceClient().rpc('change_pet_status', {
        p_owner: ana.id,
        p_pet: young.id,
        p_action: action,
        p_pending_ttl: PENDING_TTL,
      })
      expect(error?.message).toBe('litter_young')
    }
    expect((await youngOf(young.litter_id ?? ''))[0]).toMatchObject({
      status: 'available',
      expires_at: 'infinity',
    })
  })

  // Covers: R2
  it('no se borra ni se edita suelta, y no recibe enlace de renovar', async () => {
    const { ana, young } = await aYoung()
    const deleted = await serviceClient().rpc('delete_pet', { p_owner: ana.id, p_pet: young.id })
    expect(deleted.error?.message).toBe('litter_young')

    const photos = await stagedPhotos(ana.id, 1)
    const saved = await save(ana.id, young.id, photos, { name: 'Otro' })
    expect(saved.error?.message).toBe('litter_young')

    const link = await serviceClient().rpc('create_pet_renewal_link', {
      p_pet: young.id,
      p_token_hash: crypto.randomUUID(),
    })
    expect(link.error?.message).toBe('litter_young')

    expect(await youngOf(young.litter_id ?? '')).toHaveLength(2)
  })

  // Covers: R2
  it('un animal suelto sigue cambiando de estado', async () => {
    const ana = await publisher()
    const photos = await stagedPhotos(ana.id, 1)
    const { row } = await publish(ana.id, photos)
    const { data, error } = await serviceClient().rpc('change_pet_status', {
      p_owner: ana.id,
      p_pet: row?.pet_id ?? '',
      p_action: 'pause',
      p_pending_ttl: PENDING_TTL,
    })
    expect(error).toBeNull()
    expect(data?.[0]?.outcome).toBe('done')
  })
})

describeDb('borrar la cuenta con una camada', () => {
  // Covers: FR-047
  it('borra la camada, sus crías y sus fotos', async () => {
    const ana = await publisher()
    const { litterId } = await publishedLitter(ana.id, 3, 2)
    const { error } = await serviceClient().auth.admin.deleteUser(ana.id)
    expect(error).toBeNull()

    expect(await littersOf(ana.id)).toEqual([])
    expect(await youngOf(litterId)).toEqual([])
    expect(await photosOf(ana.id)).toEqual([])
  })
})

describeDb('la base es la red del formulario', () => {
  // Covers: FR-008 (la restricción diferida; la función ya rechaza antes)
  it('dos crías de la misma camada no pueden quedar con el mismo nombre', async () => {
    const ana = await publisher()
    const { litterId } = await publishedLitter(ana.id, 2)
    const [first, second] = await youngOf(litterId)
    const { error } = await db()
      .from('pets')
      .update({ name: ` ${first.name.toUpperCase()} ` })
      .eq('id', second.id)
    expect(error?.code).toBe('23505')
  })
})
