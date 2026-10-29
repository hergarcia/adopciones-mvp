// Crear un aviso y la primera aparición (historia #265, US1, research R1, R9): el resultado de cada
// pedido, el tope de 3 y los repetidos también a la vez, y la marca que decide qué es nuevo, con las
// mismas condiciones que el listado.
import { afterEach, expect, it } from 'vitest'
import { AGE_BAND_NAMES } from '../../src/lib/pets/listing-query'
import { SEXES, SIZES, SPECIES } from '../../src/lib/pets/options'
import { AGE_BANDS } from '../../src/lib/pets/rules'
import { DEPARTMENTS } from '../../src/lib/zones/departments'
import { describeDb } from '../setup/env-report'
import { changed, setState } from './lifecycle-support'
import { listLitter, youngList } from './litter-support'
import { futureWindow, listPet, listedAfter, publishers, sql } from './listing-support'
import { moderationPeople } from './moderation-support'
import {
  alertFor,
  alertsOf,
  createAlert,
  firstListedOf,
  setFirstListed,
  stampFirstListed,
} from './pet-alerts-support'
import { db } from './phone-support'
import { anonClient, serviceClient, type SyntheticUser } from './roles'

const sorted = (values: readonly (string | null | undefined)[]) =>
  values.map(String).toSorted((a, b) => a.localeCompare(b))

const cleanups: SyntheticUser['cleanup'][] = []
const { person } = moderationPeople(cleanups)
const publisher = publishers(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('crear un aviso (R9)', () => {
  // Covers: US1-AS1, US1-AS6, US1-AS7, FR-006, FR-007
  it('crea, dice repetido con los mismos filtros en otro orden y frena el cuarto', async () => {
    const bruno = await person(1, 'Bruno')

    const first = await createAlert(bruno.client, { species: ['cat'], size: ['small', 'large'] })
    const again = await createAlert(bruno.client, { size: ['large', 'small'], species: ['cat'] })
    await alertFor(bruno.client, { department: ['UY-CA'] })
    await alertFor(bruno.client)
    const fourth = await createAlert(bruno.client, { neutered: ['yes'] })

    expect([first.data, again.data, fourth.data]).toEqual(['created', 'duplicate', 'limit'])
    expect(await alertsOf(bruno.id)).toHaveLength(3)
  })

  // Covers: US1-AS5 (sin filtros también es un aviso, y guarda los seis vacíos)
  it('sin filtros guarda los seis vacíos y lo cubierto desde que se creó', async () => {
    const bruno = await person(1, 'Bruno')
    await alertFor(bruno.client)

    const [alert] = await alertsOf(bruno.id)
    expect(alert).toMatchObject({
      species: [],
      sexes: [],
      sizes: [],
      age_bands: [],
      departments: [],
      neutered_only: false,
    })
    expect(alert?.covered_until).toBe(alert?.created_at)
  })

  // Covers: FR-007 (dos pestañas a la vez con 2 avisos dejan 3)
  it('dos avisos distintos a la vez con 2 ya creados dejan 3', async () => {
    const bruno = await person(1, 'Bruno')
    await alertFor(bruno.client, { species: ['dog'] })
    await alertFor(bruno.client, { species: ['cat'] })

    const results = await Promise.all([
      createAlert(bruno.client, { size: ['small'] }),
      createAlert(bruno.client, { size: ['large'] }),
    ])

    expect(sorted(results.map((result) => result.data))).toEqual(['created', 'limit'])
    expect(await alertsOf(bruno.id)).toHaveLength(3)
  })

  // Covers: FR-006, FR-008 (tocar dos veces no deja un repetido)
  it('dos pedidos iguales a la vez dejan uno', async () => {
    const bruno = await person(1, 'Bruno')

    const results = await Promise.all([
      createAlert(bruno.client, { species: ['dog'] }),
      createAlert(bruno.client, { species: ['dog'] }),
    ])

    expect(sorted(results.map((result) => result.data))).toEqual(['created', 'duplicate'])
    expect(await alertsOf(bruno.id)).toHaveLength(1)
  })

  // Covers: FR-003 (pide una cuenta con sesión)
  it('sin sesión no se crea', async () => {
    const anon = await createAlert(anonClient())
    expect(anon.error?.code).toBe('42501')
    const service = await createAlert(serviceClient())
    expect(service.error?.message).toBe('not_signed_in')
  })
})

describeDb('la primera aparición (R1)', () => {
  // Covers: FR-015, FR-016 (la marca usa las mismas condiciones que el listado)
  it('marca exactamente lo que el listado muestra', async () => {
    const window = futureWindow()
    const carla = await publisher()
    const noPhone = await publisher({ phone: 'none' })
    const pets = await Promise.all(
      Array.from({ length: 6 }, (_, minute) =>
        listPet(carla.id, { publishedAt: window.at(minute) }),
      ),
    )
    const states = [
      'available',
      'in_process',
      'paused',
      'adopted',
      'expired',
      'taken_down',
    ] as const
    await Promise.all(states.map((state, index) => setState(pets[index]?.petId ?? '', state)))
    const withoutPhoto = await listPet(carla.id, { publishedAt: window.at(10), photos: 0 })
    const ofNoPhone = await listPet(noPhone.id, { publishedAt: window.at(11) })
    const litter = await listLitter(carla.id, window.at(12), youngList(3))
    const paused = await listLitter(carla.id, window.at(13), youngList(2))
    const pausedAt = await db()
      .from('litters')
      .update({ paused_at: new Date().toISOString() })
      .eq('id', paused.litterId)
    expect(pausedAt.error).toBeNull()
    const loose = [...pets, withoutPhoto, ofNoPhone]
    await Promise.all([
      ...loose.map((pet) => setFirstListed('pets', pet.petId, null)),
      ...[litter, paused].map((one) => setFirstListed('litters', one.litterId, null)),
    ])

    await stampFirstListed()

    const stamped = await Promise.all([
      ...loose.map(async (pet) => ({ code: pet.code, at: await firstListedOf('pets', pet.petId) })),
      ...[litter, paused].map(async (one) => ({
        code: one.code,
        at: await firstListedOf('litters', one.litterId),
      })),
    ])
    const marked = stamped.filter((row) => row.at !== null).map((row) => row.code)
    const listed = (await listedAfter(anonClient(), window)).map((row) => row.code)
    expect(sorted(marked)).toEqual(sorted(listed))
    expect(sorted(marked)).toEqual(sorted([pets[0]?.code, pets[1]?.code, litter.code]))
  })

  // Covers: FR-015, US2-AS2, US2-AS10 (pausar, reanudar, renovar ni editar dan una aparición nueva)
  it('no cambia al pausar, reanudar, renovar ni editar', async () => {
    const carla = await publisher()
    const pet = await listPet(carla.id)
    await setFirstListed('pets', pet.petId, null)
    await stampFirstListed()
    const first = await firstListedOf('pets', pet.petId)
    expect(first).not.toBeNull()

    for (const action of ['pause', 'resume', 'renew'] as const) {
      // oxlint-disable-next-line no-await-in-loop
      await changed(carla.id, pet.petId, action)
      // oxlint-disable-next-line no-await-in-loop
      await stampFirstListed()
    }
    const edited = await db()
      .from('pets')
      .update({ description: 'Ahora con descripción.' })
      .eq('id', pet.petId)
    expect(edited.error).toBeNull()
    await stampFirstListed()

    expect(await firstListedOf('pets', pet.petId)).toBe(first)
  })

  // Covers: US2-AS11 (lo que ya estaba a la vista al crear el aviso no es nuevo para él)
  it('lo que se ve al crear el aviso queda marcado antes o a la vez', async () => {
    const carla = await publisher()
    const bruno = await person(1, 'Bruno')
    const pet = await listPet(carla.id)
    await setFirstListed('pets', pet.petId, null)

    await alertFor(bruno.client)

    const [alert] = await alertsOf(bruno.id)
    const stamped = await firstListedOf('pets', pet.petId)
    expect(stamped).not.toBeNull()
    expect(new Date(String(stamped)).getTime()).toBeLessThanOrEqual(
      new Date(alert?.created_at ?? 0).getTime(),
    )
  })
})

describeDb('el vocabulario de la base es el del código', () => {
  // Covers: research R3 (los tramos de edad en SQL son AGE_BANDS)
  it.each(AGE_BAND_NAMES)('el tramo %s', async (band) => {
    const [row] = await sql<{ range: string }>(
      `select private.age_band_range('${band}')::text as range`,
    )
    const { from, to } = AGE_BANDS[band]
    expect(row?.range).toBe(`[${from},${to ?? ''})`)
  })

  const CHECKS = [
    ['pet_alerts_species_valid', SPECIES],
    ['pet_alerts_sexes_valid', SEXES],
    ['pet_alerts_sizes_valid', SIZES],
    ['pet_alerts_age_bands_valid', AGE_BAND_NAMES],
    ['pet_alerts_departments_valid', DEPARTMENTS.map((department) => department.code)],
  ] as const

  // Covers: data-model §pet_alerts (cada filtro acepta exactamente las opciones del listado)
  it.each(CHECKS)('%s', async (name, options) => {
    const [constraint] = await sql<{ definition: string }>(
      `select pg_get_constraintdef(oid) as definition from pg_constraint where conname = '${name}'`,
    )
    const accepted = [...(constraint?.definition ?? '').matchAll(/'([A-Za-z-]+)'::text/g)].map(
      (match) => match[1],
    )
    expect(sorted(accepted)).toEqual(sorted(options))
  })
})
