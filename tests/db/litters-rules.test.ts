// Las reglas de una camada que viven en la base (historia #205): publicar en una transacción e
// idempotente, de 2 a 10 crías sin nombres repetidos, la fecha de entrega, el nivel 1 y las fotos en
// espera; las crías nacen con lo común copiado y las funciones del ciclo de vida de un animal no las
// tocan. La base local solo tiene datos sintéticos.
import { afterEach, beforeEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { uruguayDay } from '../../src/lib/pets/age'
import { applicationPeople, applicationsOf, submit } from './applications-support'
import {
  LITTER_FIELDS,
  littersOf,
  publishLitter,
  publishedLitter,
  saveLitter,
  savedYoungOf,
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
const people = applicationPeople(cleanups)

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
  // Covers: US1-AS3, FR-004, FR-006, FR-014, R1, R2; R3 de #206 (el vencimiento es el de la camada)
  it('la camada y sus crías, con lo común copiado, disponibles y con el vencimiento de la camada', async () => {
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
      paused_at: null,
    })
    expect(Date.parse(litter.expires_at) - Date.now()).toBeGreaterThan(29 * 86_400_000)
    expect(Date.parse(litter.expires_at) - Date.now()).toBeLessThanOrEqual(30 * 86_400_000)

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
        expires_at: litter.expires_at,
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
      expires_at: (await littersOf(ana.id))[0].expires_at,
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

describeDb('guardar una camada (US4)', () => {
  // Covers: US4-AS1, US4-AS6, FR-014, FR-018
  it('lo común corregido llega a la camada y a cada cría; lo propio, a la suya', async () => {
    const ana = await publisher()
    const { litterId, photoIds } = await publishedLitter(ana.id, 3)
    const young = await savedYoungOf(litterId)
    young[1] = { ...young[1], name: 'Manchita', description: 'Duerme mucho.' }
    const { row, error } = await saveLitter(ana.id, litterId, photoIds, young, {
      locality: 'Malvín',
      is_urgent: true,
      required_level: 2,
      size: 'small',
      name: 'Los de Luna',
    })
    expect(error).toBeNull()
    expect(row?.released).toEqual([])

    const [litter] = await littersOf(ana.id)
    expect(litter).toMatchObject({
      name: 'Los de Luna',
      locality: 'Malvín',
      is_urgent: true,
      required_level: 2,
      size: 'small',
    })
    expect(row?.code).toBe(litter.code)
    const pets = await youngOf(litterId)
    expect(pets.map((pet) => [pet.id, pet.name, pet.description])).toEqual([
      [young[0].id, 'Cría 1', null],
      [young[1].id, 'Manchita', 'Duerme mucho.'],
      [young[2].id, 'Cría 3', null],
    ])
    for (const pet of pets) {
      expect(pet).toMatchObject({
        locality: 'Malvín',
        is_urgent: true,
        required_level: 2,
        size: 'small',
        status: 'available',
        expires_at: litter.expires_at,
      })
    }
  })

  // Covers: US4-AS1, US4-AS8, FR-016, SC-005
  it('agregar una cría con su clave dos veces la crea una sola vez, al final', async () => {
    const ana = await publisher()
    const { litterId, photoIds } = await publishedLitter(ana.id, 4)
    const [added] = youngList(1, [{ name: 'Cría 5', sex: 'male' }])
    const young = [...(await savedYoungOf(litterId)), added]
    const first = await saveLitter(ana.id, litterId, photoIds, young)
    const second = await saveLitter(ana.id, litterId, photoIds, young)
    expect(first.error).toBeNull()
    expect(second.error).toBeNull()

    const pets = await youngOf(litterId)
    expect(pets.map((pet) => pet.name)).toEqual(['Cría 1', 'Cría 2', 'Cría 3', 'Cría 4', 'Cría 5'])
    expect(pets[4]).toMatchObject({
      attempt_id: added.key,
      sex: 'male',
      expires_at: (await littersOf(ana.id))[0].expires_at,
    })
  })

  // Covers: FR-008 (la restricción diferida deja intercambiar)
  it('dos crías pueden intercambiar sus nombres; dos iguales, no', async () => {
    const ana = await publisher()
    const { litterId, photoIds } = await publishedLitter(ana.id, 2)
    const [first, second] = await savedYoungOf(litterId)
    const swapped = await saveLitter(ana.id, litterId, photoIds, [
      { ...first, name: second.name },
      { ...second, name: first.name },
    ])
    expect(swapped.error).toBeNull()
    expect((await youngOf(litterId)).map((pet) => [pet.id, pet.name])).toEqual([
      [first.id, 'Cría 2'],
      [second.id, 'Cría 1'],
    ])

    const repeated = await saveLitter(ana.id, litterId, photoIds, [
      first,
      { ...second, name: ' CRÍA 1 ' },
    ])
    expect(repeated.error?.message).toBe('young_name_taken')
  })

  // Covers: US4-AS2, US4-AS4, FR-009, FR-019
  it('quitar una cría la borra, con sus fotos sueltas, y cierra sus solicitudes', async () => {
    const owner = await people.person(1, 'Quien publica')
    const { litterId, photoIds } = await publishedLitter(owner.id, 2)
    const [kept, removed] = await savedYoungOf(litterId)
    const ownPhotos = await stagedPhotos(owner.id, 1)
    const withPhoto = await saveLitter(owner.id, litterId, photoIds, [
      kept,
      { ...removed, photo_ids: ownPhotos },
    ])
    expect(withPhoto.error).toBeNull()
    const [maria, juan] = [await people.person(1), await people.person(1)]
    const pet = (await youngOf(litterId))[1]
    expect((await submit(maria, pet.code)).outcome).toBe('sent')
    expect((await submit(juan, pet.code)).outcome).toBe('sent')

    const preview = await owner.client.rpc('preview_litter_removal', {
      p_litter: litterId,
      p_ids: [removed.id ?? ''],
    })
    expect(preview).toMatchObject({ data: 2, error: null })
    const foreign = await maria.client.rpc('preview_litter_removal', {
      p_litter: litterId,
      p_ids: [removed.id ?? ''],
    })
    expect(foreign).toMatchObject({ data: 0, error: null })

    const { row, error } = await saveLitter(owner.id, litterId, photoIds, [kept])
    expect(error).toBeNull()
    expect(row?.released).toEqual(ownPhotos)
    expect((await youngOf(litterId)).map((one) => one.id)).toEqual([kept.id])
    for (const applicant of [maria, juan]) {
      // oxlint-disable-next-line no-await-in-loop -- una persona por vez
      const [application] = await applicationsOf(applicant.id)
      expect(application).toMatchObject({
        status: 'closed',
        close_reason: 'unpublished',
        pet_name: removed.name,
      })
    }
    const [released] = (await photosOf(owner.id)).filter((photo) => photo.id === ownPhotos[0])
    expect(released).toMatchObject({ pet_id: null, position: null })
    expect(released.released_at).not.toBeNull()
  })

  // Covers: FR-011 (las fotos que se sacan quedan sueltas y se devuelven para borrarlas)
  it('una foto de la camada cambiada por otra queda suelta; la nueva entra en su lugar', async () => {
    const ana = await publisher()
    const { litterId, photoIds } = await publishedLitter(ana.id, 2, 2)
    const [fresh] = await stagedPhotos(ana.id, 1)
    const young = await savedYoungOf(litterId)
    const { row, error } = await saveLitter(ana.id, litterId, [fresh, photoIds[1]], young)
    expect(error).toBeNull()
    expect(row?.released).toEqual([photoIds[0]])
    const { data } = await db()
      .from('pet_photos')
      .select('id')
      .eq('litter_id', litterId)
      .order('position')
    expect(data?.map((photo) => photo.id)).toEqual([fresh, photoIds[1]])
  })

  // Covers: US4-AS5, FR-009
  it('ninguna cría u once no se guardan', async () => {
    const ana = await publisher()
    const { litterId, photoIds } = await publishedLitter(ana.id, 2)
    const young = await savedYoungOf(litterId)
    const none = await saveLitter(ana.id, litterId, photoIds, [])
    expect(none.error?.message).toBe('young_count')
    const eleven = await saveLitter(ana.id, litterId, photoIds, [
      ...young,
      ...youngList(9).map((one, index) => ({ ...one, name: `Nueva ${index}` })),
    ])
    expect(eleven.error?.message).toBe('young_count')
    expect(await youngOf(litterId)).toHaveLength(2)
  })

  // Covers: FR-013
  it('la fecha guardada que ya pasó no traba; cambiarla por otra pasada, sí', async () => {
    const ana = await publisher()
    const { litterId, photoIds } = await publishedLitter(ana.id, 2)
    await db()
      .from('litters')
      .update({ delivers_from: day(-3) })
      .eq('id', litterId)
    const young = await savedYoungOf(litterId)
    const same = await saveLitter(ana.id, litterId, photoIds, young, { delivers_from: day(-3) })
    expect(same.error).toBeNull()
    const other = await saveLitter(ana.id, litterId, photoIds, young, { delivers_from: day(-2) })
    expect(other.error?.message).toBe('delivery_date_past')
    const cleared = await saveLitter(ana.id, litterId, photoIds, young, { delivers_from: null })
    expect(cleared.error).toBeNull()
  })

  // Covers: US4-AS7, FR-002
  it('sin nivel 1, de otra persona, dada de baja o con una cría quitada en otra pestaña: no', async () => {
    const ana = await publisher()
    const juan = await publisher()
    const { litterId, photoIds } = await publishedLitter(ana.id, 2)
    const young = await savedYoungOf(litterId)

    const foreign = await saveLitter(juan.id, litterId, photoIds, young)
    expect(foreign.error?.message).toBe('not_found')
    const gone = await saveLitter(ana.id, litterId, photoIds, [
      young[0],
      { ...young[1], id: crypto.randomUUID() },
    ])
    expect(gone.error?.message).toBe('changed_elsewhere')

    await startChange(ana.id)
    const unverified = await saveLitter(ana.id, litterId, photoIds, young, { name: 'Otra' })
    expect(unverified.error?.message).toBe('needs_verification')

    await db()
      .from('litters')
      .update({ taken_down_at: new Date().toISOString(), takedown_reason: 'sale_or_money' })
      .eq('id', litterId)
    const takenDown = await saveLitter(ana.id, litterId, photoIds, young, { name: 'Otra' })
    expect(takenDown.error?.message).toBe('taken_down')
    expect((await littersOf(ana.id))[0].name).toBe('La camada de Luna')
  })
})

describeDb('borrar una camada al quitar la última cría (US4)', () => {
  // Covers: US4-AS3, FR-020
  it('borra la camada y sus crías, suelta todas sus fotos y cierra sus solicitudes', async () => {
    const owner = await people.person(1, 'Quien publica')
    const { litterId, code, photoIds } = await publishedLitter(owner.id, 2, 2)
    const young = await savedYoungOf(litterId)
    const ownPhotos = await stagedPhotos(owner.id, 1)
    young[0].photo_ids = ownPhotos
    expect((await saveLitter(owner.id, litterId, photoIds, young)).error).toBeNull()
    const maria = await people.person(1)
    expect((await submit(maria, (await youngOf(litterId))[0].code)).outcome).toBe('sent')

    const { data, error } = await serviceClient().rpc('delete_litter', {
      p_owner: owner.id,
      p_litter: litterId,
    })
    expect(error).toBeNull()
    expect(data?.[0]?.outcome).toBe('done')
    expect(data?.[0]?.code).toBe(code)
    expect(new Set(data?.[0]?.released)).toEqual(new Set([...photoIds, ...ownPhotos]))

    expect(await littersOf(owner.id)).toEqual([])
    expect(await youngOf(litterId)).toEqual([])
    const photos = await photosOf(owner.id)
    expect(photos).toHaveLength(3)
    for (const photo of photos) expect(photo.released_at).not.toBeNull()
    const [application] = await applicationsOf(maria.id)
    // El nombre de la camada queda en la solicitud aunque la camada ya no exista (R8 de #206).
    expect(application).toMatchObject({
      status: 'closed',
      close_reason: 'unpublished',
      litter_name: 'La camada de Luna',
    })
  })

  // Covers: FR-020 (solo la dueña)
  it('la camada de otra persona no se borra', async () => {
    const ana = await publisher()
    const juan = await publisher()
    const { litterId } = await publishedLitter(ana.id, 2)
    const { data, error } = await serviceClient().rpc('delete_litter', {
      p_owner: juan.id,
      p_litter: litterId,
    })
    expect(error).toBeNull()
    expect(data?.[0]).toEqual({
      outcome: 'not_found',
      code: null,
      released: [],
      reason_counted: false,
    })
    expect(await littersOf(ana.id)).toHaveLength(1)
  })
})
