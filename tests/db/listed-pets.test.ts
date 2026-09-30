// Los animales a la vista en la base (historia #57): qué se ve según el teléfono de quien publica,
// que nada se lea por la puerta de atrás, lo público del publicador y nada más, y el código del
// enlace. Cada regla se demuestra con un intento que tiene que fallar, sin sesión y con otra cuenta.
// La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { ageOn, uruguayDay, type StoredAge } from '../../src/lib/pets/age'
import { AGE_BANDS, PET_CODE_PATTERN } from '../../src/lib/pets/rules'
import { DB_RULES } from '../../src/lib/verification/rules'
import { describeDb } from '../setup/env-report'
import { FIELDS } from './pet-support'
import { db } from './phone-support'
import {
  countedInWindow,
  futureWindow,
  listPet,
  listedAfter,
  publishers,
  setPhone,
  sql,
  type PhoneState,
} from './listing-support'
import { anonClient, asNewUser, serviceClient, type SyntheticUser } from './roles'

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

// Los dos que no son el publicador: sin sesión y con otra cuenta.
async function visitors() {
  return [
    { who: 'sin sesión', client: anonClient() },
    { who: 'otra cuenta', client: (await stranger()).client },
  ]
}

async function byCode(client: SyntheticUser['client'], code: string) {
  const { data, error } = await client.rpc('pet_by_code', { p_code: code })
  expect(error).toBeNull()
  const rows: Record<string, unknown>[] = data ?? []
  return rows
}

async function shareCard(client: SyntheticUser['client'], code: string) {
  const { data, error } = await client.rpc('pet_share_card', { p_code: code })
  expect(error).toBeNull()
  const rows: Record<string, unknown>[] = data ?? []
  return rows
}

async function listedPet(options: Parameters<typeof publisher>[0] = {}) {
  const window = futureWindow()
  const owner = await publisher(options)
  const pet = await listPet(owner.id, { publishedAt: window.at(1), upload: true, photos: 2 })
  return { owner, window, ...pet }
}

const HIDDEN: { state: PhoneState; identity?: boolean; label: string }[] = [
  { state: 'none', label: 'sin teléfono' },
  { state: 'pending_only', label: 'con el número a medias' },
  { state: 'change_pending', label: 'con un cambio a medias vigente' },
  { state: 'lost', label: 'con el número perdido' },
  { state: 'none', identity: true, label: 'con la identidad verificada y sin teléfono' },
]

describeDb('un animal a la vista según el teléfono de quien lo publicó', () => {
  // Covers: FR-002, FR-003, SC-002, US1-AS8
  it.each(HIDDEN)('$label: no está en el listado, ni en el total, ni en la ficha', async (c) => {
    const { code, window } = await listedPet({ phone: c.state, identity: c.identity })

    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop -- dos visitantes, uno detrás del otro
      const rows = await listedAfter(client, window)
      expect(rows.map((row) => row.code)).not.toContain(code)
      // oxlint-disable-next-line no-await-in-loop
      expect(await countedInWindow(client, window)).toBe(0)
      // oxlint-disable-next-line no-await-in-loop
      const [page] = await byCode(client, code)
      expect(page.visibility).toBe('hidden')
      expect(Object.entries(page).filter(([, value]) => value !== null)).toEqual([
        ['visibility', 'hidden'],
        ['is_owner', false],
      ])
      // oxlint-disable-next-line no-await-in-loop
      expect(await shareCard(client, code)).toEqual([])
    }
  })

  // Covers: FR-002, US4-AS5
  it.each([
    { state: 'level_one' as const, label: 'con nivel 1' },
    { state: 'change_expired' as const, label: 'con un cambio a medias vencido' },
  ])('$label: está en el listado, en el total, en la ficha y en la vista previa', async (c) => {
    const { code, window } = await listedPet({ phone: c.state })

    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop -- dos visitantes, uno detrás del otro
      expect((await listedAfter(client, window)).map((row) => row.code)).toContain(code)
      // oxlint-disable-next-line no-await-in-loop
      expect(await countedInWindow(client, window)).toBe(1)
      // oxlint-disable-next-line no-await-in-loop
      const [page] = await byCode(client, code)
      expect(page).toMatchObject({ visibility: 'listed', is_owner: false, pet_id: null })
      // oxlint-disable-next-line no-await-in-loop
      expect(await shareCard(client, code)).toHaveLength(1)
    }
  })

  // Covers: FR-002, US1-AS9
  it('vuelve solo cuando el publicador confirma el número', async () => {
    const { owner, code, window } = await listedPet({ phone: 'change_pending' })
    const anon = anonClient()
    expect((await byCode(anon, code))[0].visibility).toBe('hidden')

    await setPhone(owner.id, 'level_one')

    expect((await byCode(anon, code))[0].visibility).toBe('listed')
    expect(await countedInWindow(anon, window)).toBe(1)
  })

  // Covers: FR-022
  it('borrar la cuenta lo saca: sin ficha y fuera del total', async () => {
    const { owner, code, window } = await listedPet()
    const anon = anonClient()
    expect(await countedInWindow(anon, window)).toBe(1)

    await serviceClient().auth.admin.deleteUser(owner.id)

    expect(await byCode(anon, code)).toEqual([])
    expect(await countedInWindow(anon, window)).toBe(0)
  })
})

describeDb('nada por la puerta de atrás', () => {
  // Covers: FR-003, FR-004, SC-002
  it('las tablas de otra persona no devuelven nada, con o sin sesión', async () => {
    const { owner, petId } = await listedPet({ identity: true, avatar: true })

    for (const { client } of await visitors()) {
      const reads = [
        client.from('pets').select('id').eq('id', petId),
        client.from('pet_photos').select('id').eq('pet_id', petId),
        client.from('profiles').select('id').eq('id', owner.id),
        client.from('identity_verifications').select('user_id').eq('user_id', owner.id),
        client.from('pet_codes').select('code'),
      ]
      // oxlint-disable-next-line no-await-in-loop -- dos visitantes, uno detrás del otro
      for (const { data } of await Promise.all(reads)) expect(data ?? []).toEqual([])
    }
  })

  // Covers: FR-003, FR-018, SC-002
  it('las fotos de un animal a la vista se firman; las de uno oculto, no', async () => {
    const listed = await listedPet()
    const hidden = await listedPet({ phone: 'change_pending' })
    const path = (pet: typeof listed) => `${pet.owner.id}/${pet.photoIds[1]}/card.webp`

    for (const { client } of await visitors()) {
      const bucket = client.storage.from('pet-photos')
      // oxlint-disable-next-line no-await-in-loop -- dos visitantes, uno detrás del otro
      const ok = await bucket.createSignedUrl(path(listed), 60)
      expect(ok.error).toBeNull()
      expect(ok.data?.signedUrl).toContain('card.webp')
      // oxlint-disable-next-line no-await-in-loop
      const refused = await bucket.createSignedUrl(path(hidden), 60)
      expect(refused.data).toBeNull()
    }
  })

  // Covers: FR-004, SC-003
  it('la foto de perfil se firma solo con un animal a la vista', async () => {
    const withPet = await listedPet({ avatar: true })
    const withoutPets = await publisher({ avatar: true })
    const hidden = await listedPet({ avatar: true, phone: 'lost' })
    const avatar = (id: string) => `${id}/avatar.webp`

    for (const { client } of await visitors()) {
      const bucket = client.storage.from('avatars')
      // oxlint-disable-next-line no-await-in-loop -- dos visitantes, uno detrás del otro
      expect((await bucket.createSignedUrl(avatar(withPet.owner.id), 60)).error).toBeNull()
      // oxlint-disable-next-line no-await-in-loop
      expect((await bucket.createSignedUrl(avatar(withoutPets.id), 60)).data).toBeNull()
      // oxlint-disable-next-line no-await-in-loop
      expect((await bucket.createSignedUrl(avatar(hidden.owner.id), 60)).data).toBeNull()
    }
  })

  // Covers: FR-020
  it('el publicador ve su ficha oculta entera, sin nivel, y con el id para editar', async () => {
    const { owner, code, petId } = await listedPet({ phone: 'change_pending' })

    const [page] = await byCode(owner.client, code)

    expect(page).toMatchObject({
      visibility: 'hidden',
      is_owner: true,
      pet_id: petId,
      name: 'Luna',
      publisher_name: 'Ana Rodríguez',
      publisher_level: null,
    })
    expect(page.photos).toHaveLength(2)
  })

  // Covers: FR-012, SC-004
  it('la vista previa de un código que no existe no devuelve nada', async () => {
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop -- dos visitantes, uno detrás del otro
      expect(await shareCard(client, 'zzzzzzzzzz')).toEqual([])
      // oxlint-disable-next-line no-await-in-loop
      expect(await byCode(client, 'zzzzzzzzzz')).toEqual([])
    }
  })
})

const LISTED_COLUMNS = [
  'age_as_of',
  'age_unit',
  'age_value',
  'code',
  'cover_height',
  'cover_id',
  'cover_owner',
  'cover_thumbhash',
  'cover_width',
  'department',
  'is_urgent',
  'locality',
  'name',
  'published_at',
  'sex',
  'species',
  'total',
]

const PET_COLUMNS = [
  'age_as_of',
  'age_unit',
  'age_value',
  'code',
  'department',
  'description',
  'good_with_cats',
  'good_with_dogs',
  'good_with_kids',
  'has_chip',
  'is_neutered',
  'is_owner',
  'is_urgent',
  'locality',
  'name',
  'owner_folder',
  'pet_id',
  'photos',
  'published_at',
  'publisher_avatar_path',
  'publisher_is_rescuer',
  'publisher_level',
  'publisher_name',
  'sex',
  'size',
  'species',
  'vaccines',
  'version',
  'visibility',
]

const CARD_COLUMNS = [
  'cover_height',
  'cover_id',
  'cover_owner',
  'cover_width',
  'department',
  'locality',
  'name',
  'version',
]

const occurrences = (text: string, part: string) => text.split(part).length - 1

describeDb('lo público del publicador, y nada más', () => {
  // Covers: SC-003, FR-004
  it('las tres funciones devuelven exactamente sus columnas, sin teléfono, correo ni zona', async () => {
    const { owner, code, window } = await listedPet({ identity: true, rescuer: true, avatar: true })
    const anon = anonClient()

    const [card] = await listedAfter(anon, window)
    const [page] = await byCode(anon, code)
    const [share] = await shareCard(anon, code)

    expect(Object.keys(card).sort()).toEqual(LISTED_COLUMNS)
    expect(Object.keys(page).sort()).toEqual(PET_COLUMNS)
    expect(Object.keys(share).sort()).toEqual(CARD_COLUMNS)
    for (const row of [card, page, share]) {
      const text = JSON.stringify(row)
      expect(text).not.toContain(owner.email)
      expect(text).not.toContain(owner.phone?.slice(-8))
      expect(text).not.toContain(owner.profileLocality)
      expect(text).not.toContain('UY-SA')
      expect(occurrences(text, owner.id)).toBe(row === page ? 2 : 1)
    }
    // El segundo es la ruta de la foto de perfil, que lleva la carpeta de la cuenta.
    expect(page.publisher_avatar_path).toBe(`${owner.id}/avatar.webp`)
    expect(page).toMatchObject({ publisher_is_rescuer: true, owner_folder: owner.id })
  })

  // Covers: FR-007
  it.each([
    { label: 'nivel 1', identity: false, level: 1 },
    { label: 'nivel 2', identity: true, level: 2 },
  ])('el nivel del publicador con $label es $level', async ({ identity, level }) => {
    const { code } = await listedPet({ identity })
    expect((await byCode(anonClient(), code))[0].publisher_level).toBe(level)
  })

  // Covers: FR-007 (la escalera del perfil público de la #12, plan §Reanudación 3)
  it('con un aval de alguien con nivel 2 es 3, y vuelve a 2 cuando quien avala lo pierde', async () => {
    const { code, owner } = await listedPet({ identity: true })
    const voucher = await publisher({ identity: true })
    const vouch = await db()
      .from('vouches')
      .insert({ voucher_id: voucher.id, vouchee_id: owner.id })
    expect(vouch.error).toBeNull()
    expect((await byCode(anonClient(), code))[0].publisher_level).toBe(3)

    await setPhone(voucher.id, 'lost')
    expect((await byCode(anonClient(), code))[0].publisher_level).toBe(2)
  })
})

const CODE_CASES = [
  { code: 'k3x9p2qa7m', valid: true },
  { code: '0123456789', valid: true },
  { code: 'abcdefghjk', valid: true },
  { code: 'mnpqrstvwx', valid: true },
  { code: 'yz00000000', valid: true },
  { code: 'K3X9P2QA7M', valid: false },
  { code: 'k3x9p2qa7i', valid: false },
  { code: 'k3x9p2qa7l', valid: false },
  { code: 'k3x9p2qa7o', valid: false },
  { code: 'k3x9p2qa7u', valid: false },
  { code: 'k3x9p2qa7', valid: false },
  { code: 'k3x9p2qa7mm', valid: false },
  { code: 'k3x9-2qa7m', valid: false },
  { code: '', valid: false },
]

async function acceptedByDatabase(code: string): Promise<boolean> {
  try {
    await sql(`begin; insert into public.pet_codes (code) values ('${code}'); rollback;`)
    return true
  } catch (error) {
    if (String(error).includes('pet_codes_code_format')) return false
    throw error
  }
}

describeDb('el código del enlace', () => {
  // Covers: FR-010
  it('la base y PET_CODE_PATTERN aceptan y rechazan los mismos códigos', async () => {
    for (const { code, valid } of CODE_CASES) {
      expect(PET_CODE_PATTERN.test(code)).toBe(valid)
      // oxlint-disable-next-line no-await-in-loop -- una transacción por caso
      expect(await acceptedByDatabase(code)).toBe(valid)
    }
  })

  // Covers: FR-010, SC-008
  it('cada animal tiene uno propio, registrado, que no cambia al editar ni a mano', async () => {
    const owner = await publisher()
    const first = await listPet(owner.id)
    const second = await listPet(owner.id)

    expect(first.code).toMatch(PET_CODE_PATTERN)
    expect(second.code).toMatch(PET_CODE_PATTERN)
    expect(first.code).not.toBe(second.code)
    const [unregistered] = await sql<{ count: number }>(
      'select count(*)::int as count from public.pets p where not exists (select 1 from public.pet_codes c where c.code = p.code)',
    )
    expect(unregistered.count).toBe(0)

    const edited = await db()
      .from('pets')
      .update({ name: 'Lunita', locality: 'Malvín', department: 'UY-CA' })
      .eq('id', first.petId)
      .select('code')
      .single()
    expect(edited.data?.code).toBe(first.code)

    const changed = await db().from('pets').update({ code: 'k3x9p2qa7m' }).eq('id', first.petId)
    expect(changed.error?.message).toBe('pet_code_immutable')
  })

  // Covers: FR-010
  it('el código de un animal borrado no se vuelve a usar', async () => {
    const owner = await publisher()
    const gone = await listPet(owner.id)
    await db().from('pets').delete().eq('id', gone.petId)
    const fresh = Array.from({ length: 10 }, () => 'abcdefghjk'[Math.floor(Math.random() * 10)])

    // La función que genera se reemplaza dentro de la transacción: devuelve primero el código ya
    // usado y después otro. Al deshacerse, vuelve la de verdad.
    const [row] = await sql<{ code: string }>(`
      begin;
      create temp sequence reuse_attempts;
      create or replace function private.new_pet_code() returns text language sql volatile
        set search_path = '' as $f$
          select case when nextval('pg_temp.reuse_attempts') = 1
            then '${gone.code}' else '${fresh.join('')}' end
        $f$;
      with added as (
        insert into public.pets (owner_id, attempt_id, name, species, sex, age_value, age_unit,
          age_as_of, size, is_neutered, vaccines, has_chip, department, locality)
        values ('${owner.id}', gen_random_uuid(), 'Nube', 'cat', 'female', 3, 'months',
          '2026-09-01', 'small', false, 'none', false, 'UY-MO', 'Pocitos')
        returning code
      )
      select code from added;
      rollback;
    `)

    expect(row.code).toBe(fresh.join(''))
  })
})

async function versionOf(code: string): Promise<unknown> {
  return (await shareCard(anonClient(), code))[0]?.version
}

describeDb('la versión de la vista previa', () => {
  // Covers: FR-011, US2-AS5
  it('cambia con el nombre, la zona o la portada, y no con la descripción', async () => {
    const { petId, code, photoIds } = await listedPet()
    const versions = [await versionOf(code)]
    const edits: { name?: string; locality?: string; department?: string }[] = [
      { name: 'Lunita' },
      { locality: 'Malvín' },
      { department: 'UY-CA' },
    ]
    for (const edit of edits) {
      // oxlint-disable-next-line no-await-in-loop -- un cambio por vez
      await db().from('pets').update(edit).eq('id', petId)
      // oxlint-disable-next-line no-await-in-loop
      versions.push(await versionOf(code))
    }
    await sql(
      `update public.pet_photos set position = 1 - position where pet_id = '${petId}' and id in ('${photoIds[0]}', '${photoIds[1]}')`,
    )
    versions.push(await versionOf(code))
    expect(new Set(versions).size).toBe(5)

    await db().from('pets').update({ description: 'Tranquila y cariñosa.' }).eq('id', petId)
    expect(await versionOf(code)).toBe(versions[4])
  })
})

describeDb('el TTL del número a medias', () => {
  // Covers: FR-003 (research R1: la única regla repetida, con su paridad)
  it('el de la base es el de lib/verification/rules.ts', async () => {
    const [row] = await sql<{ same: boolean }>(
      `select private.pending_ttl() = interval '${DB_RULES.p_pending_ttl}' as same`,
    )
    expect(row.same).toBe(true)
  })
})

async function tranche(
  client: SyntheticUser['client'],
  after: { published_at: string; code: string },
  limit: number,
) {
  const { data, error } = await client.rpc('listed_pets', {
    p_after_published: after.published_at,
    p_after_code: after.code,
    p_limit: limit,
  })
  expect(error).toBeNull()
  const rows: { code: string; published_at: string; total: number }[] = data ?? []
  return rows
}

describeDb('el orden y «Ver más»', () => {
  // Covers: FR-015, FR-016, SC-005, US3-AS2, US3-AS7, US4-AS4 y el Edge Case «Un animal que deja de
  // estar a la vista mientras se mira el listado»
  it('las tandas no repiten ni saltean, aunque se publique uno o se oculte otro', async () => {
    const window = futureWindow()
    const ana = await publisher()
    const lucia = await publisher()
    const codes: string[] = []
    for (let minute = 0; minute < 50; minute += 1) {
      // Uno de Lucía, entre los más viejos: se va a ocultar antes de la tercera tanda.
      const owner = minute === 1 ? lucia : ana
      // oxlint-disable-next-line no-await-in-loop -- cada uno con su minuto, en orden
      const pet = await listPet(owner.id, { publishedAt: window.at(minute) })
      codes.push(pet.code)
    }
    const anon = anonClient()
    const start = { published_at: window.end.toISOString(), code: 'zzzzzzzzzz' }

    const first = await tranche(anon, start, 25)
    expect(first.slice(0, 24).map((row) => row.code)).toEqual(codes.slice(26).reverse())
    expect(await countedInWindow(anon, window)).toBe(50)

    const newer = await listPet(ana.id, { publishedAt: window.at(100) })
    const second = await tranche(anon, first[23], 25)
    expect(second.slice(0, 24).map((row) => row.code)).toEqual(codes.slice(2, 26).reverse())

    await setPhone(lucia.id, 'change_pending')
    const third = (await tranche(anon, second[23], 25)).filter((row) => codes.includes(row.code))
    expect(third.map((row) => row.code)).toEqual([codes[0]])

    const seen = [...first.slice(0, 24), ...second.slice(0, 24), ...third].map((row) => row.code)
    expect(new Set(seen).size).toBe(seen.length)
    expect(seen).not.toContain(newer.code)
    expect(seen.sort()).toEqual(codes.filter((code) => code !== codes[1]).sort())
  })

  // Covers: Edge Case «Publicaciones con la misma fecha de publicación»
  it('con la misma fecha, el código desempata y el cursor no repite', async () => {
    const window = futureWindow()
    const ana = await publisher()
    const same = window.at(5)
    const pets = await Promise.all([0, 1, 2].map(() => listPet(ana.id, { publishedAt: same })))
    const anon = anonClient()

    let after = { published_at: window.end.toISOString(), code: 'zzzzzzzzzz' }
    const seen: string[] = []
    for (let step = 0; step < 3; step += 1) {
      // oxlint-disable-next-line no-await-in-loop -- cada tanda depende del cursor de la anterior
      const [row] = await tranche(anon, after, 1)
      seen.push(row.code)
      after = row
    }
    expect(seen).toEqual(
      pets
        .map((pet) => pet.code)
        .sort()
        .reverse(),
    )
  })
})

// Los tramos como los manda la aplicación: `[desde, hasta)` en meses.
const band = (name: keyof typeof AGE_BANDS) =>
  `[${AGE_BANDS[name].from},${AGE_BANDS[name].to ?? ''})`

const DAY = 86_400_000

describeDb('los filtros', () => {
  // Covers: FR-017, SC-006, US3-AS1, US3-AS3, US3-AS4 y los Edge Cases «Edad en el borde de un
  // tramo» y «Castrado»
  it('una opción, varias del mismo filtro, varios filtros, castrado y los bordes de edad', async () => {
    const window = futureWindow()
    const ana = await publisher()
    const today = uruguayDay(new Date())
    const monthAgo = uruguayDay(new Date(Date.now() - 40 * DAY))
    const specs: Record<string, Partial<typeof FIELDS>> = {
      gatoCachorroCanelones: {
        species: 'cat',
        age_value: 11,
        age_unit: 'months',
        department: 'UY-CA',
      },
      gatoCachorroMontevideo: {
        species: 'cat',
        age_value: 3,
        age_unit: 'months',
        department: 'UY-MO',
      },
      gatoAdultoCanelones: { species: 'cat', age_value: 3, age_unit: 'years', department: 'UY-CA' },
      perroChico: { species: 'dog', size: 'small', age_value: 1, age_unit: 'years' },
      perroMediano: { species: 'dog', size: 'medium', age_value: 2, age_unit: 'years' },
      perroGrandeSinCastrar: {
        species: 'dog',
        size: 'large',
        is_neutered: false,
        age_value: 7,
        age_unit: 'years',
      },
      perroMayor: { species: 'dog', size: 'large', age_value: 8, age_unit: 'years' },
      // Se publicó con 11 meses hace más de un mes: hoy tiene 12 y ya es joven (US3-AS4).
      creció: {
        species: 'cat',
        age_value: 11,
        age_unit: 'months',
        department: 'UY-CA',
        age_as_of: monthAgo,
      },
    }
    const codes: Record<string, string> = {}
    let minute = 0
    for (const [name, fields] of Object.entries(specs)) {
      minute += 1
      // oxlint-disable-next-line no-await-in-loop -- cada uno con su minuto
      const pet = await listPet(ana.id, {
        publishedAt: window.at(minute),
        fields: { age_as_of: today, is_neutered: true, ...fields },
      })
      codes[name] = pet.code
    }
    const ours = new Set(Object.values(codes))
    const names = Object.fromEntries(Object.entries(codes).map(([name, code]) => [code, name]))
    const match = async (filters: Record<string, unknown>) =>
      (await listedAfter(anonClient(), window, filters))
        .filter((row) => ours.has(row.code))
        .map((row) => names[row.code])

    expect(await match({ p_species: ['cat'] })).toEqual([
      'creció',
      'gatoAdultoCanelones',
      'gatoCachorroMontevideo',
      'gatoCachorroCanelones',
    ])
    expect(await match({ p_species: ['dog'], p_sizes: ['small', 'medium'] })).toEqual([
      'perroMediano',
      'perroChico',
    ])
    expect(
      await match({ p_species: ['cat'], p_age_bands: [band('puppy')], p_departments: ['UY-CA'] }),
    ).toEqual(['gatoCachorroCanelones'])
    expect(await match({ p_species: ['dog'], p_neutered_only: true })).toEqual([
      'perroMayor',
      'perroMediano',
      'perroChico',
    ])
    expect(await match({ p_age_bands: [band('young')] })).toEqual([
      'creció',
      'perroMediano',
      'perroChico',
    ])
    expect(await match({ p_age_bands: [band('adult')] })).toEqual([
      'perroGrandeSinCastrar',
      'gatoAdultoCanelones',
    ])
    expect(await match({ p_age_bands: [band('senior')] })).toEqual(['perroMayor'])
    expect(await match({ p_age_bands: [band('puppy'), band('senior')] })).toEqual([
      'perroMayor',
      'gatoCachorroMontevideo',
      'gatoCachorroCanelones',
    ])
    expect(await match({ p_departments: ['UY-SA'] })).toEqual([])
  })
})

const AGE_CASES: { stored: StoredAge; today: string }[] = [
  { stored: { value: 1, unit: 'months', asOf: '2026-01-31' }, today: '2026-02-27' },
  { stored: { value: 1, unit: 'months', asOf: '2026-01-31' }, today: '2026-02-28' },
  { stored: { value: 1, unit: 'months', asOf: '2028-01-31' }, today: '2028-02-28' },
  { stored: { value: 1, unit: 'months', asOf: '2028-01-31' }, today: '2028-02-29' },
  { stored: { value: 1, unit: 'months', asOf: '2026-01-31' }, today: '2026-03-30' },
  { stored: { value: 11, unit: 'months', asOf: '2025-12-15' }, today: '2026-01-14' },
  { stored: { value: 11, unit: 'months', asOf: '2025-12-15' }, today: '2026-01-15' },
  { stored: { value: 10, unit: 'months', asOf: '2025-12-31' }, today: '2026-02-28' },
  { stored: { value: 2, unit: 'years', asOf: '2024-03-10' }, today: '2025-03-09' },
  { stored: { value: 2, unit: 'years', asOf: '2024-03-10' }, today: '2025-03-10' },
  { stored: { value: 7, unit: 'years', asOf: '2020-02-29' }, today: '2021-02-28' },
  { stored: { value: 3, unit: 'months', asOf: '2026-09-28' }, today: '2026-09-01' },
]

describeDb('la edad en la base es la de la ficha', () => {
  // Covers: FR-017, SC-006 (research R5: la edad que filtra la base es la que muestra `ageOn`)
  it.each(AGE_CASES)('$stored.value $stored.unit desde $stored.asOf, el $today', async (c) => {
    const [row] = await sql<{ months: number }>(
      `select private.pet_age_months(${c.stored.value}::smallint, '${c.stored.unit}', '${c.stored.asOf}', '${c.today}') as months`,
    )
    const age =
      row.months < 12
        ? { value: row.months, unit: 'months' }
        : { value: Math.floor(row.months / 12), unit: 'years' }
    expect(age).toEqual(ageOn(c.stored, c.today))
  })
})
