// Las reglas de Administrar en la base (historia #73). Las colas: qué es un pendiente, qué es lo
// propio de quien mira y desde cuándo espera el más viejo; el número del menú; lo llegado a
// Opiniones y Encuestas en 7 días; qué antecedentes junta la ficha de una persona; y a quién reclama
// el resumen de la mañana.
import { afterEach, beforeAll, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  ancientWindow,
  claimDigests,
  claimedWithOnlyOwnOf,
  digestDaysBeforeToday,
  digestsClaimedOn,
  forgetDigestsClaimedSince,
  othersAs,
  pendingIdentity,
  pendingPet,
  pendingReport,
  pendingTotalAs,
  queueCountAs,
  recentCountsAs,
  nameTag,
  recordAs,
  searchAs,
} from './admin-support'
import { addRejections, daysAgo, makeExpired } from './identity-support'
import { setState } from './lifecycle-support'
import { sql } from './listing-support'
import { close, lift, moderationPeople, suspend } from './moderation-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'
import { insertAsOwner, uruguayDay } from './surveys-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin } = moderationPeople(cleanups)
const feedbackAttempts: string[] = []
const answerBodies: string[] = []

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
  await db().from('feedback').delete().in('attempt_id', feedbackAttempts.splice(0))
  await db().from('survey_answers').delete().in('body', answerBodies.splice(0))
})

describeDb('las tres colas de quien administra', () => {
  // Covers: US1-AS5, US1-AS6, FR-013, spec §Edge Cases (lo mío nunca atrasa, varias personas)
  it('cada cola cuenta lo de otras y deja lo propio aparte, con el animal y sin el reporte', async () => {
    const lucia = await admin('Lucía')
    const marta = await admin('Marta')
    const bruno = await person(1, 'Bruno')
    const before = { lucia: await othersAs(lucia.client), marta: await othersAs(marta.client) }

    await pendingIdentity(bruno)
    await pendingPet(bruno, 'Luna')
    await pendingReport(lucia, bruno)
    await pendingIdentity(lucia)
    await pendingPet(lucia, 'Tobi')
    await pendingReport(bruno, lucia)

    expect(await othersAs(lucia.client)).toEqual({
      identity: before.lucia.identity + 1,
      pets: before.lucia.pets + 1,
      reports: before.lucia.reports + 1,
    })
    expect(await othersAs(marta.client)).toEqual({
      identity: before.marta.identity + 2,
      pets: before.marta.pets + 2,
      reports: before.marta.reports + 2,
    })

    const own = await Promise.all(
      (['identity', 'pets', 'reports'] as const).map(
        async (queue) => (await queueCountAs(lucia.client, queue)).own,
      ),
    )
    expect(own.map((items) => (Array.isArray(items) ? items.length : -1))).toEqual([1, 1, 1])
    const [identity, pets, reports] = own.map((items) => (Array.isArray(items) ? items[0] : null))
    expect(identity).toEqual({ since: expect.any(String), pet_name: null })
    expect(pets).toEqual({ since: expect.any(String), pet_name: 'Tobi' })
    expect(reports).toEqual({ since: expect.any(String), pet_name: null })
    expect((await queueCountAs(marta.client, 'pets')).own).toEqual([])
  })

  // Covers: spec §Edge Cases (un pedido que vence; una publicación de una cuenta suspendida)
  it('un pedido vencido y la publicación de una cuenta suspendida no cuentan', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    const request = await pendingIdentity(bruno)
    await pendingPet(bruno, 'Luna')
    const before = await othersAs(lucia.client)

    await makeExpired(request)
    await suspend(bruno.id)

    expect(await othersAs(lucia.client)).toEqual({
      identity: before.identity - 1,
      pets: before.pets - 1,
      reports: before.reports,
    })
  })

  // Covers: FR-010, FR-013 (la espera es la del más viejo de lo que puedo resolver)
  it('el más viejo es el de lo que puedo resolver, aunque lo mío espere más', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    const at = ancientWindow()
    await pendingPet(lucia, 'Tobi', at(0))
    await pendingPet(bruno, 'Luna', at(10))
    await pendingPet(bruno, 'Sol', at(20))
    await pendingIdentity(lucia, at(0))
    await pendingIdentity(bruno, at(30))
    await pendingReport(bruno, lucia, at(0))
    await pendingReport(lucia, bruno, at(40))

    const pets = await queueCountAs(lucia.client, 'pets')
    expect(new Date(pets.oldest).toISOString()).toBe(at(10))
    expect(pets.own).toEqual([{ since: expect.stringMatching(/^1\d{3}-/u), pet_name: 'Tobi' }])
    expect(new Date((await queueCountAs(lucia.client, 'identity')).oldest).toISOString()).toBe(
      at(30),
    )
    expect(new Date((await queueCountAs(lucia.client, 'reports')).oldest).toISOString()).toBe(
      at(40),
    )
  })

  it('lo propio sale del más viejo al más nuevo', async () => {
    const lucia = await admin('Lucía')
    const at = ancientWindow()
    await pendingPet(lucia, 'Nuevo', at(50))
    await pendingPet(lucia, 'Viejo', at(5))

    const { own } = await queueCountAs(lucia.client, 'pets')
    expect(
      Array.isArray(own) ? own.map((item) => Reflect.get(Object(item), 'pet_name')) : [],
    ).toEqual(['Viejo', 'Nuevo'])
  })

  it('una cola que no existe es un error, no una cola vacía', async () => {
    const lucia = await admin('Lucía')
    const { error } = await lucia.client.rpc('admin_queue_count', { p_queue: 'opiniones' })
    expect(error?.code).toBe('22023')
  })

  // Covers: FR-020, US1-AS2, US1-AS7 (el número del menú es la suma de lo que puedo resolver)
  it('el número del menú es la suma de las tres colas, sin lo propio', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    await pendingPet(bruno, 'Luna')
    await pendingPet(lucia, 'Tobi')
    await pendingReport(lucia, bruno)

    const others = await othersAs(lucia.client)
    expect(await pendingTotalAs(lucia.client)).toBe(others.identity + others.pets + others.reports)
  })
})

describeDb('Opiniones y Encuestas en los últimos 7 días', () => {
  // Covers: FR-014, US1-AS8, spec §Edge Cases (hoy y los 6 días anteriores)
  it('cuentan lo llegado hoy y los 6 días anteriores, y no el séptimo', async () => {
    const lucia = await admin('Lucía')
    const before = await recentCountsAs(lucia.client)
    const days = [await uruguayDay(0), await uruguayDay(6), await uruguayDay(7)]
    const attempts = days.map(() => crypto.randomUUID())
    const bodies = days.map(() => `Respuesta ${crypto.randomUUID()}`)
    feedbackAttempts.push(...attempts)
    answerBodies.push(...bodies)

    await insertAsOwner(
      'feedback',
      days.map((day, index) => ({
        body: 'Una opinión',
        screen: 'home',
        sent_on: day,
        attempt_id: attempts[index] ?? '',
      })),
    )
    await insertAsOwner(
      'survey_answers',
      days.map((day, index) => ({
        moment: 'gave',
        option: 'yes',
        body: bodies[index] ?? '',
        answered_on: day,
      })),
    )

    expect(await recentCountsAs(lucia.client)).toEqual({
      feedback: before.feedback + 2,
      survey_answers: before.survey_answers + 2,
    })
  })
})

describeDb('la ficha de una persona', () => {
  // Covers: FR-032, spec §Edge Cases (antecedentes que caducan)
  it('trae los rechazos de los últimos 30 días y el vencimiento de esa ventana, no los de antes', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    const marta = await person(1, 'Marta')
    await addRejections(bruno.id, 29, 30)
    await insertExpiration(bruno.id, daysAgo(29))
    await insertExpiration(marta.id, daysAgo(30))

    const record = await recordAs(lucia.client, bruno.publicId)
    expect(record?.identity).toEqual({
      verified_on: null,
      open: null,
      rejections: [{ rejected_on: daysAgo(29), reason: 'unreadable' }],
      expired_on: daysAgo(29),
    })
    expect(
      Reflect.get(Object((await recordAs(lucia.client, marta.publicId))?.identity), 'expired_on'),
    ).toBeNull()
  })

  // Covers: FR-032, US2-AS1 (verificada, y el pedido en revisión con el camino a resolverlo)
  it('dice el día en que se verificó y el pedido en revisión, propio o no', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(2, 'Bruno')
    const ana = await person(1, 'Ana')
    const request = await pendingIdentity(ana)
    const own = await pendingIdentity(lucia)
    const identityOf = async (target: { publicId: string }) =>
      Object((await recordAs(lucia.client, target.publicId))?.identity)

    expect(await identityOf(bruno)).toEqual({
      verified_on: '2026-08-14',
      open: null,
      rejections: [],
      expired_on: null,
    })
    expect(Reflect.get(await identityOf(ana), 'open')).toEqual({
      id: request,
      sent_at: expect.any(String),
      is_own: false,
    })
    expect(Reflect.get(await identityOf(lucia), 'open')).toEqual({
      id: own,
      sent_at: expect.any(String),
      is_own: true,
    })
  })

  // Covers: FR-033, US2-AS1 (los reportes sobre la persona, con cómo se cerraron)
  it('trae los reportes sobre la persona, del más nuevo al más viejo, con motivo, texto y cierre', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    const ana = await person(1, 'Ana')
    const at = ancientWindow()
    const dismissed = await pendingReport(ana, bruno, at(0))
    expect((await close(lucia.client, dismissed)).decision).toBe('done')
    await pendingReport(lucia, bruno, at(10))
    await pendingReport(bruno, ana)

    const reports = (await recordAs(lucia.client, bruno.publicId))?.reports
    expect(reports).toEqual({
      own_open: 0,
      items: [
        {
          reason: 'sells_animals',
          details: 'Publicó cachorros con precio',
          created_at: expect.stringMatching(/^1\d{3}-/u),
          resolved_at: null,
          resolution: null,
        },
        {
          reason: 'sells_animals',
          details: 'Publicó cachorros con precio',
          created_at: expect.stringMatching(/^1\d{3}-/u),
          resolved_at: expect.any(String),
          resolution: 'dismissed',
        },
      ],
    })
    const items: unknown = Reflect.get(Object(reports), 'items')
    const created = Array.isArray(items)
      ? items.map((item) => new Date(Reflect.get(Object(item), 'created_at')).toISOString())
      : []
    expect(created).toEqual([at(10), at(0)])
  })

  // Covers: FR-034, spec §Edge Cases (quién suspendió con una cuenta que ya no existe)
  it('trae las suspensiones, con quién suspendió y reactivó, y nulo si esa cuenta se borró', async () => {
    const lucia = await admin('Lucía')
    const gone = await admin('Quien se fue')
    const bruno = await person(1, 'Bruno')
    const first = await suspend(bruno.id, gone.id)
    await lift(first)
    await reactivatedBy(first, lucia.id)
    await suspend(bruno.id, lucia.id)
    await gone.cleanup()

    const record = await recordAs(lucia.client, bruno.publicId)
    expect(record?.suspensions).toEqual([
      {
        reason: 'Motivo de prueba',
        suspended_at: expect.any(String),
        suspended_by_name: 'Lucía',
        lifted_at: null,
        lifted_by_name: null,
      },
      {
        reason: 'Motivo de prueba',
        suspended_at: expect.any(String),
        suspended_by_name: null,
        lifted_at: expect.any(String),
        lifted_by_name: 'Lucía',
      },
    ])
    expect(Reflect.get(Object(record?.person), 'suspension')).toEqual({
      id: expect.any(String),
      reason: 'Motivo de prueba',
      suspended_at: expect.any(String),
      suspended_by_name: 'Lucía',
    })
  })

  // Covers: FR-035, US2-AS1 (cada publicación con su estado, por revisar y el motivo de baja)
  it('trae las publicaciones con su estado, si están por revisar y el motivo de la baja; la borrada no', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    const luna = await pendingPet(bruno, 'Luna')
    const tobi = await pendingPet(bruno, 'Tobi')
    const sol = await pendingPet(bruno, 'Sol')
    await pendingPet(bruno, 'Sombra')
    await setState(tobi, 'taken_down')
    await setState(luna, 'paused')
    await reviewed(luna)
    const { error } = await db().from('pets').delete().eq('id', sol)
    expect(error).toBeNull()

    const pets = (await recordAs(lucia.client, bruno.publicId))?.pets
    const byName = new Map(
      (Array.isArray(pets) ? pets : []).map((pet) => [Reflect.get(Object(pet), 'name'), pet]),
    )
    expect([...byName.keys()].sort((a, b) => String(a).localeCompare(String(b)))).toEqual([
      'Luna',
      'Sombra',
      'Tobi',
    ])
    const pet = (name: string, state: string, pendingReview: boolean, takedown: string | null) => ({
      code: expect.any(String),
      name,
      state,
      pending_review: pendingReview,
      takedown_reason: takedown,
      published_at: expect.any(String),
    })
    expect(byName.get('Luna')).toEqual(pet('Luna', 'paused', false, null))
    expect(byName.get('Tobi')).toEqual(pet('Tobi', 'taken_down', false, 'other'))
    expect(byName.get('Sombra')).toEqual(pet('Sombra', 'available', true, null))
  })

  // Covers: FR-031 (el nivel: 0 sin teléfono verificado)
  it('el nivel es 0 sin teléfono verificado y el de quien publica con él', async () => {
    const lucia = await admin('Lucía')
    const nadie = await person(0, 'Sin teléfono')
    const bruno = await person(2, 'Bruno')

    expect(
      Reflect.get(Object((await recordAs(lucia.client, nadie.publicId))?.person), 'level'),
    ).toBe(0)
    expect(
      Reflect.get(Object((await recordAs(lucia.client, bruno.publicId))?.person), 'level'),
    ).toBe(2)
  })

  // Covers: FR-039, US2-AS9 (una cuenta borrada no tiene ficha)
  it('una cuenta borrada no devuelve ninguna fila', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    await pendingReport(lucia, bruno)
    await bruno.cleanup()

    expect(await recordAs(lucia.client, bruno.publicId)).toBeNull()
  })
})

describeDb('buscar a una persona por nombre', () => {
  const capital = (tag: string) => `${tag.charAt(0).toUpperCase()}${tag.slice(1)}`

  // Covers: US4-AS1, US4-AS2, FR-050 (sin tildes ni mayúsculas, y las dos con el mismo nombre)
  it('pliega tildes, eñes y mayúsculas, y encuentra a las dos que se llaman igual', async () => {
    const lucia = await admin('Lucía')
    const tag = nameTag()
    const marta = await person(1, `Marta Suárez ${capital(tag)}`)
    const nandu = await person(1, `Ñandú Ávila ${capital(tag)}`)
    const anas = [
      await person(1, `Ana Pérez ${capital(tag)}`),
      await person(1, `Ana Pérez ${capital(tag)}`),
    ]

    expect(await searchAs(lucia.client, `marta suarez ${tag}`)).toEqual([
      {
        public_id: marta.publicId,
        display_name: `Marta Suárez ${capital(tag)}`,
        avatar_path: null,
        department: 'UY-MO',
        locality: 'Malvín',
        is_suspended: false,
      },
    ])
    expect(
      (await searchAs(lucia.client, `  MARTA   SUÁREZ ${tag.toUpperCase()} `)).map(
        (row) => row.public_id,
      ),
    ).toEqual([marta.publicId])
    expect(
      (await searchAs(lucia.client, `nandu avila ${tag}`)).map((row) => row.public_id),
    ).toEqual([nandu.publicId])
    expect(
      (await searchAs(lucia.client, `ana perez ${tag}`)).map((row) => row.public_id).toSorted(),
    ).toEqual(anas.map((ana) => ana.publicId).toSorted())
  })

  // Covers: US4-AS5, FR-051 (al menos 3 letras, sin contar los espacios)
  it('con menos de 3 letras, sin contar los espacios, no busca', async () => {
    const lucia = await admin('Lucía')
    const tag = nameTag()
    await person(1, `Ab ${capital(tag)}`)

    expect(await searchAs(lucia.client, 'ab')).toEqual([])
    expect(await searchAs(lucia.client, '  a b  ')).toEqual([])
    expect(await searchAs(lucia.client, '   ')).toEqual([])
    expect(await searchAs(lucia.client, tag.slice(0, 3))).not.toEqual([])
  })

  // Covers: research R6 (quien empieza con lo escrito va primero)
  it('quien empieza con lo escrito va primero, aunque por orden alfabético fuera después', async () => {
    const lucia = await admin('Lucía')
    const tag = nameTag()
    const inside = await person(1, `Ana ${capital(tag)}`)
    const starts = await person(1, `${capital(tag)} Zapata`)

    expect((await searchAs(lucia.client, tag)).map((row) => row.public_id)).toEqual([
      starts.publicId,
      inside.publicId,
    ])
  })

  // Covers: US4-AS3, US4-AS4, FR-052 (las suspendidas sí, con su marca; las borradas no)
  it('encuentra a una suspendida con la marca y no a una cuenta borrada', async () => {
    const lucia = await admin('Lucía')
    const tag = nameTag()
    const bruno = await person(1, `Bruno ${capital(tag)}`)
    const carla = await person(1, `Carla ${capital(tag)}`)
    await suspend(bruno.id)

    expect(
      (await searchAs(lucia.client, `bruno ${tag}`)).map((row) => [
        row.public_id,
        row.is_suspended,
      ]),
    ).toEqual([[bruno.publicId, true]])
    expect(await searchAs(lucia.client, `carla ${tag}`)).toHaveLength(1)

    await carla.cleanup()
    expect(await searchAs(lucia.client, `carla ${tag}`)).toEqual([])
  })

  // Covers: US4-AS7, FR-054 (con más de 20, una de más dice que hay más)
  it('con más de 20 que coinciden trae 21, una más que las que se muestran', async () => {
    const lucia = await admin('Lucía')
    const tag = nameTag()
    await Promise.all(
      Array.from({ length: 22 }, (_, index) => person(0, `Persona ${index} ${capital(tag)}`)),
    )

    expect(await searchAs(lucia.client, tag, 20)).toHaveLength(21)
    expect(await searchAs(lucia.client, tag, 21)).toHaveLength(22)
  })
})

describeDb('el resumen de la mañana', () => {
  let today = ''
  let claimedBefore: string[] = []

  beforeAll(async () => {
    today = await uruguayDay(0)
    claimedBefore = await digestsClaimedOn(today)
  })

  afterEach(async () => {
    await forgetDigestsClaimedSince(today, claimedBefore)
  })

  // Covers: FR-060, FR-061, US3-AS1, US3-AS4, US3-AS6 (lo de otras, sin lo suyo; nunca a una
  // suspendida)
  it('reclama a quien tiene algo, con lo de otras y sin lo suyo, y a quien está suspendida no', async () => {
    const lucia = await admin('Lucía')
    const ana = await admin('Ana')
    const marta = await admin('Marta')
    const bruno = await person(1, 'Bruno')
    await pendingPet(bruno, 'Luna')
    await pendingPet(lucia, 'Tobi')
    await pendingIdentity(lucia)
    await pendingReport(bruno, lucia)
    await suspend(marta.id)
    const expected = async (client: typeof lucia.client) => {
      const counts = await Promise.all(
        (['identity', 'pets', 'reports'] as const).map((queue) => queueCountAs(client, queue)),
      )
      const oldest = (at: string | null) => (at === null ? null : new Date(at).toISOString())
      return counts.flatMap((count) => [count.others, oldest(count.oldest)])
    }
    const want = { lucia: await expected(lucia.client), ana: await expected(ana.client) }

    const claims = await claimDigests()

    const got = (id: string) => {
      const row = claims.find((claim) => claim.user_id === id)
      const oldest = (at: string | null | undefined) =>
        at === null || at === undefined ? null : new Date(at).toISOString()
      return row === undefined
        ? null
        : [
            row.identity_count,
            oldest(row.identity_oldest),
            row.pets_count,
            oldest(row.pets_oldest),
            row.reports_count,
            oldest(row.reports_oldest),
          ]
    }
    expect(got(lucia.id)).toEqual(want.lucia)
    expect(got(ana.id)).toEqual(want.ana)
    expect(want.ana[2]).toBe(Number(want.lucia[2]) + 1)
    expect(want.ana[0]).toBe(Number(want.lucia[0]) + 1)
    expect(want.ana[4]).toBe(Number(want.lucia[4]) + 1)
    expect(got(marta.id)).toBeNull()
  })

  // Covers: FR-063, US3-AS5 (nunca dos el mismo día, aunque la tarea corra dos veces)
  it('la segunda llamada del día no vuelve a reclamar a nadie', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    await pendingPet(bruno, 'Luna')

    const first = await claimDigests()
    const second = await claimDigests()

    expect(first.map((claim) => claim.user_id)).toContain(lucia.id)
    expect(second).toEqual([])
    expect((await digestsClaimedOn(today)).filter((id) => id === lucia.id)).toEqual([lucia.id])
  })

  // Covers: FR-060, US3-AS3 (sin nada, o solo lo mío, no me llega nada)
  it('a quien solo tiene lo suyo esperando no la reclama; a otra que administra, por eso, sí', async () => {
    const lucia = await admin('Lucía')
    const ana = await admin('Ana')
    await pendingPet(lucia, 'Tobi')

    const claimed = await claimedWithOnlyOwnOf(lucia.id)

    expect(claimed).toContain(ana.id)
    expect(claimed).not.toContain(lucia.id)
  })

  // Covers: research R8 (la fila del envío no guarda nada y se purga a los 7 días)
  it('borra los envíos de más de 7 días y deja el del séptimo', async () => {
    const lucia = await admin('Lucía')
    const days = [await uruguayDay(8), await uruguayDay(7)]
    const { error } = await db()
      .from('admin_digest_sends')
      .insert(days.map((day) => ({ user_id: lucia.id, day })))
    expect(error).toBeNull()

    await claimDigests()

    expect(await digestDaysBeforeToday(lucia.id, today)).toEqual([days[1]])
  })

  // Covers: FR-060 (a las 8 de la mañana de Uruguay, que está en UTC−3 todo el año)
  it('la tarea corre todos los días a las 11 UTC y llama a la aplicación', async () => {
    expect(
      await sql<{ schedule: string; command: string }>(
        `select schedule, command from cron.job where jobname = 'admin-digest'`,
      ),
    ).toEqual([{ schedule: '0 11 * * *', command: 'select public.admin_digest_tick()' }])
  })
})

async function insertExpiration(userId: string, on: string) {
  const { error } = await db()
    .from('identity_expirations')
    .insert({ user_id: userId, expired_on: on, notice_pending: false })
  expect(error).toBeNull()
}

async function reactivatedBy(suspensionId: string, by: string) {
  const { error } = await db()
    .from('account_suspensions')
    .update({ lifted_by: by })
    .eq('id', suspensionId)
  expect(error).toBeNull()
}

async function reviewed(petId: string) {
  const { error } = await db()
    .from('pet_reviews')
    .update({ pending_since: null, pending_kind: null })
    .eq('pet_id', petId)
  expect(error).toBeNull()
}
