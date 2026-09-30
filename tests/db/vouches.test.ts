// Lo que NO se ve del aval y del perfil público (historia #12, FR-005, FR-026, SC-001). Lo ajeno
// sale solo por `public_profile`, que recorta en la base; las tablas de avales no se leen desde el
// cliente, ni siendo parte del aval. Cada prueba intenta leer o escribir lo que no debe.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { db } from './phone-support'
import { anonClient, serviceClient, type SyntheticUser } from './roles'
import {
  TTL,
  give,
  pauseLevel,
  people,
  publicProfile,
  resumeLevel,
  vouchersOf,
} from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const person = people(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

const INVENTED = 'AAAAAAAAAAAAAAAAAAAAAA'

describeDb('las funciones del aval, desde afuera', () => {
  // Covers: FR-013, FR-026. Si una se pudiera llamar con la sesión, cualquiera daría avales en
  // nombre de otra persona o leería lo que la función recorta.
  it('nadie las ejecuta sin la clave de servicio, ninguna de las nueve', async () => {
    const ana = await person()
    const beto = await person()
    const publicCalls: [string, Record<string, unknown>][] = [
      ['public_profile', { p_public_id: beto.publicId, p_pending_ttl: TTL }],
      ['avatar_path_for', { p_public_id: beto.publicId }],
      ['vouch_standing', { p_viewer: ana.id, p_target_public_id: beto.publicId }],
      ['my_vouches', { p_user: beto.id, p_pending_ttl: TTL }],
      ['give_vouch', { p_voucher: ana.id, p_vouchee_public_id: beto.publicId, p_pending_ttl: TTL }],
      ['withdraw_vouch', { p_voucher: ana.id, p_vouchee_public_id: beto.publicId }],
      ['remove_vouch', { p_vouchee: beto.id, p_voucher_public_id: ana.publicId }],
    ]
    const privateCalls: [string, Record<string, unknown>][] = [
      ['has_level_two', { p_user: beto.id, p_pending_ttl: TTL }],
      ['lock_vouch', { p_voucher: ana.id, p_vouchee: beto.id }],
    ]

    const attempts = await Promise.all(
      [ana.client, anonClient()].flatMap((client) => [
        ...publicCalls.map(async ([name, args]) => ({
          name,
          error: (await client.rpc(name, args)).error,
        })),
        ...privateCalls.map(async ([name, args]) => ({
          name,
          error: (await client.schema('private').rpc(name, args)).error,
        })),
      ]),
    )
    expect(attempts).toHaveLength(18)
    expect(attempts.filter((attempt) => attempt.error === null).map((a) => a.name)).toEqual([])

    const { count } = await db()
      .from('vouches')
      .select('*', { count: 'exact', head: true })
      .eq('vouchee_id', beto.id)
    expect(count).toBe(0)
  })

  // Covers: FR-026. Una policy de las dos partes le daría a cada una el id de cuenta de la otra.
  it('las tablas de avales y de quitas no se leen, tampoco siendo parte del aval', async () => {
    const ana = await person()
    const beto = await person()
    const carla = await person()
    expect((await give(ana, beto)).outcome).toBe('given')
    await serviceClient().from('vouch_blocks').insert({ voucher_id: carla.id, vouchee_id: beto.id })

    const reads = await Promise.all(
      [ana.client, beto.client, carla.client, anonClient()].flatMap((client) => [
        client.from('vouches').select('*'),
        client.from('vouch_blocks').select('*'),
      ]),
    )
    expect(reads).toHaveLength(8)
    expect(reads.map((read) => read.data ?? [])).toEqual(reads.map(() => []))
  })

  it('nadie inserta un aval directo en la tabla', async () => {
    const ana = await person()
    const beto = await person()

    const { error } = await ana.client
      .from('vouches')
      .insert({ voucher_id: ana.id, vouchee_id: beto.id })
    expect(error).not.toBeNull()
    expect(await vouchersOf(beto)).toEqual([])
  })

  // Covers: SC-001. El perfil público no abre el perfil, la identidad ni el teléfono de nadie.
  it('el perfil, la identidad y el teléfono de otra persona siguen cerrados', async () => {
    const ana = await person()
    const beto = await person()

    const reads = await Promise.all(
      [ana.client, anonClient()].flatMap((client) => [
        client.from('profiles').select('*').eq('id', beto.id),
        client.from('identity_verifications').select('*').eq('user_id', beto.id),
        client.from('phones').select('*').eq('user_id', beto.id),
      ]),
    )
    expect(reads).toHaveLength(6)
    expect(reads.map((read) => read.data ?? [])).toEqual(reads.map(() => []))
  })
})

describeDb('lo que sale de otra persona', () => {
  // Covers: FR-005, SC-001. Si una clave de más aparece, el perfil público la lleva escondida.
  it('exactamente la lista de FR-005, sin id de cuenta, días exactos ni la ruta de la foto', async () => {
    const beto = await person(2, 'Beto Silva')

    const row = await publicProfile(beto.publicId)
    expect(Object.keys(row ?? {}).sort()).toEqual([
      'department',
      'display_name',
      'has_photo',
      'identity_since',
      'is_rescuer',
      'level_one',
      'locality',
      'member_since',
      'public_id',
      'vouchers',
    ])
    expect(JSON.stringify(row)).not.toContain(beto.id)
    expect(JSON.stringify(row)).not.toContain(beto.email)
    expect(row).toMatchObject({
      public_id: beto.publicId,
      display_name: 'Beto Silva',
      has_photo: false,
      level_one: true,
      identity_since: '2026-08-01',
      vouchers: [],
    })
  })

  // Covers: FR-005, SC-001. De quien avala sale lo que su propio perfil ya muestra: si apareciera el
  // id de la cuenta o la ruta de la foto, el perfil de otra persona los dejaría ver.
  it('de quien avala sale su nombre, su zona y si tiene foto, y nada más', async () => {
    const ana = await person(2, 'Ana Aval')
    const carla = await person()
    await db()
      .from('profiles')
      .update({ avatar_path: `${ana.id}/avatar.webp` })
      .eq('id', ana.id)
    await give(ana, carla)

    const row = await publicProfile(carla.publicId)
    expect(row?.vouchers).toEqual([
      {
        public_id: ana.publicId,
        display_name: 'Ana Aval',
        department: 'UY-MO',
        locality: 'Malvín',
        has_photo: true,
      },
    ])
    expect(JSON.stringify(row)).not.toContain(ana.id)
  })

  // Covers: US1-AS4, Edge Cases «Fechas en el borde del mes».
  it('los meses van en hora de Uruguay: el 31 de agosto a las 23:30 es agosto', async () => {
    const beto = await person()
    await db()
      .from('profiles')
      .update({ created_at: '2026-08-31T23:30:00-03:00' })
      .eq('id', beto.id)

    expect((await publicProfile(beto.publicId))?.member_since).toBe('2026-08-01')
  })

  // Covers: FR-006, US1-AS9. Sin nivel 1 la identidad no sale: diría por qué no tiene nivel.
  it('sin nivel 1 no sale el mes de la identidad, aunque la tenga', async () => {
    const beto = await person()
    await pauseLevel(beto.id)

    const row = await publicProfile(beto.publicId)
    expect(row?.level_one).toBe(false)
    expect(row?.identity_since).toBeNull()
  })

  // Covers: FR-002, US3-AS10, Edge Cases «Un aval en pausa».
  it('un aval en pausa por quien lo dio no sale, y vuelve solo al recuperar el nivel', async () => {
    const ana = await person()
    const carla = await person()
    await give(ana, carla)

    await pauseLevel(ana.id)
    expect(await vouchersOf(carla)).toEqual([])
    await resumeLevel(ana.id)
    expect(await vouchersOf(carla)).toEqual([ana.publicId])
  })

  it('los avales de quien perdió el nivel 2 no salen, y vuelven al recuperarlo', async () => {
    const ana = await person()
    const carla = await person()
    await give(ana, carla)

    await pauseLevel(carla.id)
    expect(await vouchersOf(carla)).toEqual([])
    await resumeLevel(carla.id)
    expect(await vouchersOf(carla)).toEqual([ana.publicId])
  })

  it('los avales que cuentan, del más reciente al más viejo', async () => {
    const ana = await person()
    const beto = await person()
    const carla = await person()
    await give(ana, carla)
    await give(beto, carla)
    await db()
      .from('vouches')
      .update({ created_at: '2026-01-01T12:00:00Z' })
      .eq('voucher_id', ana.id)

    expect(await vouchersOf(carla)).toEqual([beto.publicId, ana.publicId])
  })

  // Covers: FR-007, SC-002. Los tres «no existe» son la misma respuesta de la base.
  it('cero filas para un id inventado, una cuenta borrada y un perfil sin completar', async () => {
    const beto = await person()
    await serviceClient().auth.admin.deleteUser(beto.id)

    expect(await publicProfile(INVENTED)).toBeNull()
    expect(await publicProfile(beto.publicId)).toBeNull()
  })

  // Covers: FR-005, research R7. La foto sale por su ruta, sin el id de la cuenta en la URL.
  it('la ruta de la foto, solo para un perfil completo con foto', async () => {
    const beto = await person()
    const ana = await person()
    await db()
      .from('profiles')
      .update({ avatar_path: `${beto.id}/avatar.webp` })
      .eq('id', beto.id)

    const path = async (publicId: string) =>
      (await db().rpc('avatar_path_for', { p_public_id: publicId })).data
    expect(await path(beto.publicId)).toBe(`${beto.id}/avatar.webp`)
    expect((await publicProfile(beto.publicId))?.has_photo).toBe(true)
    expect(await path(ana.publicId)).toBeNull()
    expect(await path(INVENTED)).toBeNull()
  })
})
