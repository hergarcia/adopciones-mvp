// Cuándo se hace «¿Qué te frena?» y qué queda al contestarla o seguir sin contestar (historia #234,
// research R2, R3): una sola vez por persona y nivel, también con dos llamadas a la vez; a quién no
// se le pregunta; una sola respuesta por pregunta; lo que se rechaza; y que no toca la encuesta de
// #71 (FR-006).
import { afterEach, expect, it } from 'vitest'
import { EXIT_OPTIONS } from '../../src/lib/verification/exit-question'
import { describeDb } from '../setup/env-report'
import { sql } from './listing-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'
import {
  FIRST_TEXTS,
  answerAs,
  answersOf,
  answersWith,
  askAs,
  askedTicket,
  asksOf,
  countsOf,
  deleteAnswers,
  dueAs,
  exitPeople,
  insertAnswers,
  originIn,
  skipAs,
  summaryAs,
  textsAs,
  ticketExists,
} from './verification-exits-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { noPhone, pendingPhone, levelOne, changingPhone, lostPhone, approved, suspended, admin } =
  exitPeople(cleanups)

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) {
    // oxlint-disable-next-line no-await-in-loop
    await cleanup()
  }
})

describeDb('la lista de opciones de la base es la del código (R6)', () => {
  it('cada nivel acepta sus cinco opciones y ninguna otra', async () => {
    const candidates = [...new Set([...EXIT_OPTIONS.phone, ...EXIT_OPTIONS.identity, 'nope'])]
    for (const level of ['phone', 'identity', 'vouch'] as const) {
      // oxlint-disable-next-line no-await-in-loop
      const rows = await sql<{ option: string }>(
        `select o as option from unnest(array[${candidates.map((c) => `'${c}'`).join(',')}]) o
          where private.verification_exit_option_valid('${level}', o)`,
      )
      const expected = level === 'vouch' ? [] : EXIT_OPTIONS[level]
      expect(new Set(rows.map((row) => row.option))).toEqual(new Set(expected))
    }
  })
})

describeDb('a quién se le hace la pregunta de la identidad (R2)', () => {
  // Covers: US1-AS1, US1-AS3
  it('a quien nunca la tuvo, una sola vez, la conteste o no', async () => {
    const bruno = await levelOne()
    expect(await dueAs(bruno.client, 'identity')).toBe(true)
    const ticket = await askedTicket(bruno.client, 'identity', 'apply')
    expect(await asksOf(bruno.id)).toEqual(['identity'])
    expect(await dueAs(bruno.client, 'identity')).toBe(false)
    expect((await askAs(bruno.client, 'identity', 'apply')).ticket).toBeNull()
    expect((await skipAs(bruno.client, ticket)).result?.outcome).toBe('skipped')
    expect((await askAs(bruno.client, 'identity', 'self')).ticket).toBeNull()
  })

  it('dos llamadas a la vez dejan una sola marca y un solo ticket', async () => {
    const bruno = await levelOne()
    const before = await countsOf('identity', 'self')
    const both = await Promise.all([
      askAs(bruno.client, 'identity', 'self'),
      askAs(bruno.client, 'identity', 'self'),
    ])
    expect(both.map((call) => call.error)).toEqual([null, null])
    expect(both.filter((call) => call.ticket !== null)).toHaveLength(1)
    expect(await asksOf(bruno.id)).toEqual(['identity'])
    expect((await countsOf('identity', 'self')).asked).toBe(before.asked + 1)
  })

  it('no a quien tiene la identidad aprobada ni a una cuenta suspendida', async () => {
    for (const who of [await approved(), await suspended()]) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await dueAs(who.client, 'identity')).toBe(false)
      // oxlint-disable-next-line no-await-in-loop
      expect((await askAs(who.client, 'identity', 'apply')).ticket).toBeNull()
      // oxlint-disable-next-line no-await-in-loop
      expect(await asksOf(who.id)).toEqual([])
    }
  })

  it('un nivel o un origen que no son: nada', async () => {
    const bruno = await levelOne()
    expect(await dueAs(bruno.client, 'vouch')).toBe(false)
    expect((await askAs(bruno.client, 'vouch', 'self')).ticket).toBeNull()
    expect((await askAs(bruno.client, 'identity', 'profile')).ticket).toBeNull()
    expect(await asksOf(bruno.id)).toEqual([])
  })

  // Covers: US1-AS4
  it('recibir la del teléfono no impide la de la identidad', async () => {
    const bruno = await levelOne()
    await db().from('verification_exit_asks').insert({ person_id: bruno.id, level: 'phone' })
    expect(await dueAs(bruno.client, 'identity')).toBe(true)
    await askedTicket(bruno.client, 'identity', 'self')
    expect(await asksOf(bruno.id)).toEqual(['identity', 'phone'])
  })

  // Covers: US1-AS6, FR-006
  it('una encuesta de #71 pendiente no la frena, y la pregunta no la toca', async () => {
    const ana = await levelOne()
    const offer = {
      person_id: ana.id,
      moment: 'gave',
      subject_id: crypto.randomUUID(),
      offered_on: new Date().toISOString().slice(0, 10),
      state: 'pending',
    }
    await db().from('survey_offers').insert(offer).throwOnError()
    const surveyCounts = await db().from('survey_counts').select('*').order('moment')
    await askedTicket(ana.client, 'identity', 'self')
    const { data: offers } = await db()
      .from('survey_offers')
      .select('moment, subject_id, offered_on, state')
      .eq('person_id', ana.id)
    expect(offers).toEqual([
      {
        moment: offer.moment,
        subject_id: offer.subject_id,
        offered_on: offer.offered_on,
        state: 'pending',
      },
    ])
    expect((await db().from('survey_counts').select('*').order('moment')).data).toEqual(
      surveyCounts.data,
    )
  })
})

describeDb('preguntar suma en su nivel y su origen (FR-023)', () => {
  it('asked + 1 en (nivel, origen) y en ningún otro', async () => {
    const bruno = await levelOne()
    const before = {
      apply: await countsOf('identity', 'apply'),
      self: await countsOf('identity', 'self'),
      phone: await countsOf('phone', 'apply'),
    }
    await askedTicket(bruno.client, 'identity', 'apply')
    expect(await countsOf('identity', 'apply')).toEqual({
      ...before.apply,
      asked: before.apply.asked + 1,
    })
    expect(await countsOf('identity', 'self')).toEqual(before.self)
    expect(await countsOf('phone', 'apply')).toEqual(before.phone)
  })
})

describeDb('contestar, una sola vez (R3, FR-014)', () => {
  // Covers: US1-AS1, US1-AS12, US1-AS13
  it('answered con el nivel y el origen del ticket, y después already', async () => {
    const bruno = await levelOne()
    const before = await answersOf('identity', 'apply', 'no_id_photos')
    const laterBefore = await answersOf('identity', 'apply', 'later')
    const ticket = await askedTicket(bruno.client, 'identity', 'apply')
    expect((await answerAs(bruno.client, ticket, 'no_id_photos')).result).toEqual({
      outcome: 'answered',
      level: 'identity',
      origin: 'apply',
    })
    expect(await ticketExists(ticket)).toBe(false)
    expect((await answerAs(bruno.client, ticket, 'later')).result).toEqual({
      outcome: 'already',
      level: null,
      origin: null,
    })
    expect((await skipAs(bruno.client, ticket)).result?.outcome).toBe('already')
    expect(await answersOf('identity', 'apply', 'no_id_photos')).toBe(before + 1)
    expect(await answersOf('identity', 'apply', 'later')).toBe(laterBefore)
  })

  it('dos contestaciones a la vez dejan una sola respuesta', async () => {
    const bruno = await levelOne()
    const body = `dos pestañas ${crypto.randomUUID()}`
    const ticket = await askedTicket(bruno.client, 'identity', 'self')
    const both = await Promise.all([
      answerAs(bruno.client, ticket, 'other', body),
      answerAs(bruno.client, ticket, 'other', body),
    ])
    expect(
      both.map((call) => call.result?.outcome).sort((a, b) => String(a).localeCompare(String(b))),
    ).toEqual(['already', 'answered'])
    expect(await answersWith(body)).toBe(1)
  })

  // Covers: US1-AS2, US1-AS8
  it('«Otra cosa» con texto, sin los bordes, y vacía sin texto', async () => {
    const diego = await levelOne()
    const body = `no tengo la cédula, tengo pasaporte ${crypto.randomUUID()}`
    const ticket = await askedTicket(diego.client, 'identity', 'self')
    expect((await answerAs(diego.client, ticket, 'other', `  ${body}  `)).result?.outcome).toBe(
      'answered',
    )
    expect(await answersWith(body)).toBe(1)

    const ana = await levelOne()
    const empty = await askedTicket(ana.client, 'identity', 'self')
    const before = await answersOf('identity', 'self', 'other')
    expect((await answerAs(ana.client, empty, 'other', '   ')).result?.outcome).toBe('answered')
    expect(await answersOf('identity', 'self', 'other')).toBe(before + 1)
  })

  it('una opción del otro nivel, texto sin «Otra cosa» o de 301: invalid y el ticket sigue', async () => {
    const bruno = await levelOne()
    const ticket = await askedTicket(bruno.client, 'identity', 'self')
    for (const [option, body] of [
      ['no_code', null],
      ['nope', null],
      ['later', 'algo'],
      ['other', 'a'.repeat(301)],
    ] as const) {
      // oxlint-disable-next-line no-await-in-loop
      expect((await answerAs(bruno.client, ticket, option, body)).result).toEqual({
        outcome: 'invalid',
        level: 'identity',
        origin: 'self',
      })
    }
    expect(await ticketExists(ticket)).toBe(true)
    expect((await answerAs(bruno.client, ticket, 'other', 'a'.repeat(300))).result?.outcome).toBe(
      'answered',
    )
  })
})

describeDb('seguir sin contestar (R3)', () => {
  // Covers: US1-AS5
  it('skipped una vez, suma en su origen y no guarda respuesta', async () => {
    const bruno = await levelOne()
    const ticket = await askedTicket(bruno.client, 'identity', 'apply')
    const before = await countsOf('identity', 'apply')
    expect((await skipAs(bruno.client, ticket)).result).toEqual({
      outcome: 'skipped',
      level: 'identity',
      origin: 'apply',
    })
    expect(await countsOf('identity', 'apply')).toEqual({ ...before, skipped: before.skipped + 1 })
    expect((await skipAs(bruno.client, ticket)).result?.outcome).toBe('already')
    expect((await answerAs(bruno.client, ticket, 'later')).result?.outcome).toBe('already')
    expect((await countsOf('identity', 'apply')).skipped).toBe(before.skipped + 1)
  })
})

describeDb('a quién se le hace la pregunta del teléfono (R2)', () => {
  // Covers: US2-AS1, US2-AS3
  it('a quien nunca terminó de verificar uno, sin número o con uno a medias', async () => {
    for (const carla of [await noPhone(), await pendingPhone()]) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await dueAs(carla.client, 'phone')).toBe(true)
    }
  })

  // Covers: US2-AS5
  it('una sola vez: con la marca, ya no', async () => {
    const carla = await pendingPhone()
    await askedTicket(carla.client, 'phone', 'publish')
    expect(await asksOf(carla.id)).toEqual(['phone'])
    expect(await dueAs(carla.client, 'phone')).toBe(false)
    expect((await askAs(carla.client, 'phone', 'publish')).ticket).toBeNull()
  })

  // Covers: US2-AS4, US2-AS6
  it('no a quien lo tiene verificado, lo está cambiando o lo perdió (#25)', async () => {
    for (const ana of [await levelOne(), await changingPhone(), await lostPhone()]) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await dueAs(ana.client, 'phone')).toBe(false)
      // oxlint-disable-next-line no-await-in-loop
      expect((await askAs(ana.client, 'phone', 'self')).ticket).toBeNull()
      // oxlint-disable-next-line no-await-in-loop
      expect(await asksOf(ana.id)).toEqual([])
    }
  })

  // Covers: US2-AS2, US2-AS4 — «Cancelar la verificación» pregunta después de cancelar: tiene que
  // seguir correspondiendo con el número a medias ya cancelado, y no con un cambio cancelado.
  it('después de cancelar: sí la primera vez, no un cambio', async () => {
    const ana = await pendingPhone()
    await db().rpc('cancel_pending_phone', { p_user_id: ana.id }).throwOnError()
    expect(await dueAs(ana.client, 'phone')).toBe(true)

    const bruno = await changingPhone()
    await db().rpc('cancel_pending_phone', { p_user_id: bruno.id }).throwOnError()
    expect(await dueAs(bruno.client, 'phone')).toBe(false)
  })

  it('contestar guarda la opción del teléfono con el origen del ticket', async () => {
    const ana = await pendingPhone()
    const before = await answersOf('phone', 'apply', 'no_code')
    const ticket = await askedTicket(ana.client, 'phone', 'apply')
    expect((await answerAs(ana.client, ticket, 'no_code')).result).toEqual({
      outcome: 'answered',
      level: 'phone',
      origin: 'apply',
    })
    expect(await answersOf('phone', 'apply', 'no_code')).toBe(before + 1)
  })
})

describeDb('Encuestas: por qué no se verificaron (R8)', () => {
  const written: string[] = []

  afterEach(async () => {
    await deleteAnswers(written.splice(0))
  })

  // Covers: US3-AS1, FR-017, FR-018
  it('cuenta las preguntadas, las seguidas sin contestar y cada opción en su nivel y su origen', async () => {
    const reader = await admin()
    const before = await summaryAs(reader.client)
    const first = await pendingPhone()
    const answered = await askedTicket(first.client, 'phone', 'publish')
    expect((await answerAs(first.client, answered, 'groups')).result?.outcome).toBe('answered')
    const second = await noPhone()
    const skipped = await askedTicket(second.client, 'phone', 'publish')
    expect((await skipAs(second.client, skipped)).result?.outcome).toBe('skipped')
    const third = await levelOne()
    await askedTicket(third.client, 'identity', 'apply')

    const rows = await summaryAs(reader.client)
    expect(rows.map((row) => `${row.level}.${row.origin}.${row.option}`)).toEqual(
      (['phone', 'identity'] as const).flatMap((level) =>
        ['publish', 'apply', 'self', 'asked'].flatMap((origin) =>
          EXIT_OPTIONS[level].map((option) => `${level}.${origin}.${option}`),
        ),
      ),
    )
    const was = originIn(before, 'phone', 'publish')
    expect(originIn(rows, 'phone', 'publish')).toEqual({
      asked: was.asked + 2,
      skipped: was.skipped + 1,
      chosen: { ...was.chosen, groups: (was.chosen.groups ?? 0) + 1 },
    })
    const identity = originIn(before, 'identity', 'apply')
    expect(originIn(rows, 'identity', 'apply')).toEqual({ ...identity, asked: identity.asked + 1 })
    expect(originIn(rows, 'phone', 'self')).toEqual(originIn(before, 'phone', 'self'))
  })

  // Covers: US3-AS3, FR-023, SC-005
  it('borrar la cuenta de quien contestó borra su marca y no cambia ningún número ni texto', async () => {
    const reader = await admin()
    const diego = await levelOne()
    const body = `no tengo la cédula, tengo pasaporte ${crypto.randomUUID()}`
    const ticket = await askedTicket(diego.client, 'identity', 'self')
    expect((await answerAs(diego.client, ticket, 'other', body)).result?.outcome).toBe('answered')
    const before = await summaryAs(reader.client)
    expect(await asksOf(diego.id)).toEqual(['identity'])

    await diego.cleanup()
    expect(await asksOf(diego.id)).toEqual([])
    expect(await summaryAs(reader.client)).toEqual(before)
    expect(await answersWith(body)).toBe(1)
  })

  // Covers: US3-AS2, US3-AS7, FR-019
  it('los textos: solo con texto, de su nivel, del más nuevo al más viejo, con el cursor', async () => {
    const reader = await admin()
    const ids = {
      newest: '00000000-0000-4000-8000-0000000000a3',
      sameDayHigh: '00000000-0000-4000-8000-0000000000a2',
      sameDayLow: '00000000-0000-4000-8000-0000000000a1',
      noText: '00000000-0000-4000-8000-0000000000a4',
      otherLevel: '00000000-0000-4000-8000-0000000000a5',
    }
    written.push(...Object.values(ids))
    // Días que nadie más usa: las respuestas de las demás pruebas son de hoy.
    await insertAnswers([
      {
        id: ids.newest,
        level: 'identity',
        option: 'other',
        body: 'el más nuevo',
        answered_on: '2999-02-03',
      },
      {
        id: ids.sameDayHigh,
        level: 'identity',
        option: 'other',
        body: 'mismo día, id mayor',
        answered_on: '2999-02-02',
      },
      {
        id: ids.sameDayLow,
        level: 'identity',
        option: 'other',
        body: 'mismo día, id menor',
        answered_on: '2999-02-02',
      },
      { id: ids.noText, level: 'identity', option: 'other', body: null, answered_on: '2999-02-04' },
      {
        id: ids.otherLevel,
        level: 'phone',
        option: 'other',
        body: 'del teléfono',
        answered_on: '2999-02-05',
      },
    ])

    expect(await textsAs(reader.client, 'identity', FIRST_TEXTS, 2)).toEqual([
      { id: ids.newest, body: 'el más nuevo', answered_on: '2999-02-03' },
      { id: ids.sameDayHigh, body: 'mismo día, id mayor', answered_on: '2999-02-02' },
    ])
    const next = await textsAs(
      reader.client,
      'identity',
      { on: '2999-02-02', id: ids.sameDayHigh },
      1,
    )
    expect(next).toEqual([
      { id: ids.sameDayLow, body: 'mismo día, id menor', answered_on: '2999-02-02' },
    ])
    expect(await textsAs(reader.client, 'phone', FIRST_TEXTS, 1)).toEqual([
      { id: ids.otherLevel, body: 'del teléfono', answered_on: '2999-02-05' },
    ])
  })
})
