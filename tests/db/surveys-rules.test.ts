// Cuándo se ofrece la encuesta y qué queda al responderla o cerrarla (historia #71, research R2, R3,
// R5, R7): los desenlaces que ofrecen y los cierres que no, el arranque, los 30 días, el doble toque,
// «Yo no adopté», la cuenta suspendida y las cuentas que no cambian al borrar una cuenta. Y lo que
// lee quien administra en Encuestas (US3).
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { backdate } from './follow-ups-support'
import { declineAdoption } from './adoptions-support'
import { insertApplication } from './applications-support'
import { markAccepted, reject, revoke, responsePeople } from './application-responses-support'
import { suspend } from './moderation-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'
import {
  FIRST_PAGE,
  answerAs,
  answersAs,
  answersWith,
  insertAsOwner,
  countsOf,
  dismissAs,
  momentIn,
  myPetsSurveyAs,
  offersOf,
  pendingFor,
  seenOffer,
  summaryAs,
  surveyForAs,
  surveyPeople,
  uruguayDay,
} from './surveys-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, handedOver, gaveOutside } = surveyPeople(cleanups)
const { scene } = responsePeople(cleanups)

// De a una, como en las de la adopción: las cascadas de quien publica y de quien adopta se cruzan.
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) {
    // oxlint-disable-next-line no-await-in-loop
    await cleanup()
  }
})

describeDb('los desenlaces que ofrecen la encuesta (R3)', () => {
  // Covers: US1-AS1, US1-AS2, US1-AS5
  it('dar en adopción, adoptar y quedar sin elegir al marcar adoptado ofrecen la de su momento', async () => {
    const tobi = await handedOver()

    const gave = await myPetsSurveyAs(tobi.publisher.client)
    expect(gave).toEqual([
      expect.objectContaining({
        moment: 'gave',
        state: 'pending',
        newly_offered: true,
        pet_id: tobi.pet.petId,
      }),
    ])
    expect(await surveyForAs(tobi.chosen, 'adopted', tobi.chosenId)).toEqual([
      expect.objectContaining({ moment: 'adopted', state: 'pending', newly_offered: true }),
    ])
    for (const [who, id] of [
      [tobi.other, tobi.otherId],
      [tobi.waiting, tobi.waitingId],
    ] as const) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await surveyForAs(who, 'not_chosen', id)).toEqual([
        expect.objectContaining({ moment: 'not_chosen', state: 'pending', newly_offered: true }),
      ])
    }
  })

  // Covers: US1-AS6
  it('dar por fuera del sitio ofrece la misma encuesta', async () => {
    const { publisher, adoptions } = await gaveOutside(1)
    const rows = await myPetsSurveyAs(publisher.client)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ moment: 'gave', state: 'pending' })
    expect((await offersOf(publisher.id)).map((offer) => offer.subject_id)).toEqual(adoptions)
  })

  // Covers: US1-AS3, US1-AS4
  it('una solicitud rechazada y una aceptación dejada sin efecto ofrecen «no fue elegida»', async () => {
    const rejected = await scene('sent')
    await reject(rejected.publisher, rejected.id, 'housing')
    expect(await pendingFor(rejected.applicant, 'not_chosen', rejected.id)).not.toBe('')

    const revoked = await scene('sent')
    await markAccepted(revoked.id)
    await revoke(revoked.publisher, revoked.id, 'not_concluded')
    expect(await pendingFor(revoked.applicant, 'not_chosen', revoked.id)).not.toBe('')
  })

  // Covers: US1-AS11
  it.each([
    ['sent', null],
    ['accepted', null],
    ['withdrawn', null],
    ['closed', 'unpublished'],
    ['closed', 'not_receiving'],
    ['closed', 'you_blocked'],
    ['closed', 'suspended'],
    ['closed', 'handed_over'],
  ] as const)('una solicitud %s (%s) no ofrece nada', async (status, closeReason) => {
    const { applicant, id } = await scene(status, { closeReason: closeReason ?? undefined })
    expect(await surveyForAs(applicant, 'not_chosen', id)).toEqual([])
    expect(await offersOf(applicant.id)).toEqual([])
  })

  it('el desenlace de otro momento o de otra persona no ofrece nada', async () => {
    const tobi = await handedOver()
    expect(await surveyForAs(tobi.chosen, 'gave', tobi.chosenId)).toEqual([])
    expect(await surveyForAs(tobi.other, 'adopted', tobi.otherId)).toEqual([])
    expect(await surveyForAs(tobi.publisher, 'adopted', tobi.chosenId)).toEqual([])
    expect(await surveyForAs(tobi.other, 'not_chosen', tobi.chosenId)).toEqual([])
    expect(await offersOf(tobi.chosen.id)).toEqual([])
  })

  it('un desenlace anterior al arranque no ofrece nada (R6)', async () => {
    const tobi = await handedOver()
    await backdate(tobi.pet.petId, '2020-01-01T15:00:00Z')
    expect(await myPetsSurveyAs(tobi.publisher.client)).toEqual([])
    expect(await surveyForAs(tobi.chosen, 'adopted', tobi.chosenId)).toEqual([])
  })

  // Covers: US1-AS9
  it('volver a abrir la pantalla no cambia nada: la misma oferta, ya no nueva', async () => {
    const tobi = await handedOver()
    const first = await myPetsSurveyAs(tobi.publisher.client)
    const again = await myPetsSurveyAs(tobi.publisher.client)
    expect(again).toEqual([{ ...first[0], newly_offered: false }])
    const offered = await countsOf('gave')
    await myPetsSurveyAs(tobi.publisher.client)
    expect(await countsOf('gave')).toEqual(offered)
    expect(await offersOf(tobi.publisher.id)).toHaveLength(1)
  })
})

describeDb('una cada 30 días (FR-005)', () => {
  // Covers: US1-AS7
  it('a los 29 días de la anterior queda sin ofrecer para siempre; a los 30 se ofrece', async () => {
    const recent = await scene('sent')
    await seenOffer(recent.applicant.id, await uruguayDay(29))
    await reject(recent.publisher, recent.id, 'housing')
    expect(await surveyForAs(recent.applicant, 'not_chosen', recent.id)).toEqual([
      expect.objectContaining({ state: 'skipped', newly_offered: false }),
    ])
    const skipped = (await offersOf(recent.applicant.id)).find((o) => o.subject_id === recent.id)
    expect(skipped).toMatchObject({ state: 'skipped', offered_on: null })

    const old = await scene('sent')
    await seenOffer(old.applicant.id, await uruguayDay(30))
    await reject(old.publisher, old.id, 'housing')
    await pendingFor(old.applicant, 'not_chosen', old.id)
    const pending = (await offersOf(old.applicant.id)).find((o) => o.subject_id === old.id)
    expect(pending?.offered_on).toBe(await uruguayDay(0))
  })

  it('una sin ofrecer no vuelve aunque pasen los 30 días', async () => {
    const recent = await scene('sent')
    await seenOffer(recent.applicant.id, await uruguayDay(29))
    await reject(recent.publisher, recent.id, 'housing')
    await surveyForAs(recent.applicant, 'not_chosen', recent.id)
    const moved = await db()
      .from('survey_offers')
      .delete()
      .eq('person_id', recent.applicant.id)
      .eq('state', 'answered')
    expect(moved.error).toBeNull()
    expect(await surveyForAs(recent.applicant, 'not_chosen', recent.id)).toEqual([
      expect.objectContaining({ state: 'skipped' }),
    ])
  })

  it('dos desenlaces de una persona: uno pendiente y el otro sin ofrecer', async () => {
    const first = await scene('sent')
    const second = await insertApplication(first.applicant, first.pet, first.publisher, {
      status: 'closed',
      close_reason: 'adopted',
    })
    await reject(first.publisher, first.id, 'housing')
    await pendingFor(first.applicant, 'not_chosen', first.id)
    expect(await surveyForAs(first.applicant, 'not_chosen', second)).toEqual([
      expect.objectContaining({ state: 'skipped' }),
    ])
  })

  it('Mis animales con tres adopciones nuevas ofrece una, la más nueva', async () => {
    const { publisher, adoptions } = await gaveOutside(3)
    const rows = await myPetsSurveyAs(publisher.client)
    expect(rows).toHaveLength(1)
    const offers = await offersOf(publisher.id)
    expect(offers.map((o) => [o.subject_id, o.state])).toEqual(
      expect.arrayContaining([
        [adoptions[2], 'pending'],
        [adoptions[1], 'skipped'],
        [adoptions[0], 'skipped'],
      ]),
    )
    expect(rows[0]?.offer_id).toBe(offers.find((o) => o.state === 'pending')?.id)
  })
})

describeDb('responder y cerrar (R7)', () => {
  // Covers: US1-AS1, US1-AS15, US1-AS16
  it('responder dos veces deja una sola respuesta', async () => {
    const tobi = await handedOver()
    const [row] = await myPetsSurveyAs(tobi.publisher.client)
    const body = `me ahorró las entrevistas ${crypto.randomUUID()}`
    expect((await answerAs(tobi.publisher.client, row?.offer_id ?? '', 'yes', body)).outcome).toBe(
      'answered',
    )
    expect((await answerAs(tobi.publisher.client, row?.offer_id ?? '', 'no', body)).outcome).toBe(
      'already',
    )
    expect(await answersWith(body)).toBe(1)
    expect(await myPetsSurveyAs(tobi.publisher.client)).toEqual([])
    expect((await offersOf(tobi.publisher.id))[0]?.state).toBe('answered')
  })

  // Covers: US1-AS8
  it('«Ahora no» la cierra, la cuenta como cerrada y responder después no guarda nada', async () => {
    const tobi = await handedOver()
    const offer = await pendingFor(tobi.chosen, 'adopted', tobi.chosenId)
    const before = await countsOf('adopted')
    expect((await dismissAs(tobi.chosen.client, offer)).outcome).toBe('dismissed')
    expect((await dismissAs(tobi.chosen.client, offer)).outcome).toBe('already')
    expect(await countsOf('adopted')).toEqual({ ...before, dismissed: before.dismissed + 1 })
    const body = `después de cerrar ${crypto.randomUUID()}`
    expect((await answerAs(tobi.chosen.client, offer, 'yes', body)).outcome).toBe('dismissed')
    expect(await answersWith(body)).toBe(0)
    expect(await surveyForAs(tobi.chosen, 'adopted', tobi.chosenId)).toEqual([
      expect.objectContaining({ state: 'dismissed' }),
    ])
  })

  it('cerrar una respondida no la cuenta como cerrada', async () => {
    const tobi = await handedOver()
    const offer = await pendingFor(tobi.chosen, 'adopted', tobi.chosenId)
    expect((await answerAs(tobi.chosen.client, offer, 'somewhat')).outcome).toBe('answered')
    const before = await countsOf('adopted')
    expect((await dismissAs(tobi.chosen.client, offer)).outcome).toBe('already')
    expect(await countsOf('adopted')).toEqual(before)
  })

  // Covers: US1-AS2 (sin escribir nada), US1-AS12 (la base también frena la opción)
  it('la opción de otro momento y más de 500 caracteres no se guardan; 500 sí', async () => {
    const tobi = await handedOver()
    const offer = await pendingFor(tobi.chosen, 'adopted', tobi.chosenId)
    expect((await answerAs(tobi.chosen.client, offer, 'maybe')).outcome).toBe('invalid')
    expect((await answerAs(tobi.chosen.client, offer, 'yes', 'a'.repeat(501))).outcome).toBe(
      'invalid',
    )
    expect((await offersOf(tobi.chosen.id))[0]?.state).toBe('pending')
    const body = `${crypto.randomUUID()}${'a'.repeat(464)}`
    expect((await answerAs(tobi.chosen.client, offer, 'somewhat', `  ${body}  `)).outcome).toBe(
      'answered',
    )
    expect(await answersWith(body)).toBe(1)
  })

  it('solo espacios se guarda como sin texto', async () => {
    const tobi = await handedOver()
    const offer = await pendingFor(tobi.other, 'not_chosen', tobi.otherId)
    expect((await answerAs(tobi.other.client, offer, 'back_to_groups', '   ')).outcome).toBe(
      'answered',
    )
    expect(await answersWith('')).toBe(0)
  })
})

describeDb('«Yo no adopté» retira la encuesta pendiente (R5)', () => {
  // Covers: US1-AS10
  it('sin responder: la oferta se borra, no cuenta y no frena la de otro desenlace', async () => {
    const tobi = await handedOver()
    await pendingFor(tobi.chosen, 'adopted', tobi.chosenId)
    const before = await countsOf('adopted')
    expect((await declineAdoption(tobi.chosen, tobi.chosenId)).outcome).toBe('done')
    expect(await offersOf(tobi.chosen.id)).toEqual([])
    expect(await countsOf('adopted')).toEqual({ ...before, offered: before.offered - 1 })
    expect(await surveyForAs(tobi.chosen, 'adopted', tobi.chosenId)).toEqual([])
    // Su propia solicitud, que «Yo no adopté» cerró como que encontró hogar, no es un «no elegida».
    expect(await surveyForAs(tobi.chosen, 'not_chosen', tobi.chosenId)).toEqual([])

    const next = await scene('sent')
    const other = await insertApplication(tobi.chosen, next.pet, next.publisher)
    await reject(next.publisher, other, 'housing')
    await pendingFor(tobi.chosen, 'not_chosen', other)
  })

  it('respondida: la respuesta y la cuenta quedan', async () => {
    const tobi = await handedOver()
    const offer = await pendingFor(tobi.chosen, 'adopted', tobi.chosenId)
    expect((await answerAs(tobi.chosen.client, offer, 'yes')).outcome).toBe('answered')
    const before = await countsOf('adopted')
    expect((await declineAdoption(tobi.chosen, tobi.chosenId)).outcome).toBe('done')
    expect(await countsOf('adopted')).toEqual(before)
    expect((await offersOf(tobi.chosen.id))[0]?.state).toBe('answered')
  })
})

describeDb('cuenta suspendida y cuenta borrada', () => {
  // Covers: US1-AS17
  it('una cuenta suspendida no ve encuesta y no puede responderla ni cerrarla', async () => {
    const tobi = await handedOver()
    const offer = await pendingFor(tobi.chosen, 'adopted', tobi.chosenId)
    await suspend(tobi.chosen.id)
    expect(await surveyForAs(tobi.chosen, 'adopted', tobi.chosenId)).toEqual([])
    expect((await answerAs(tobi.chosen.client, offer, 'yes')).outcome).toBe('suspended')
    expect((await dismissAs(tobi.chosen.client, offer)).outcome).toBe('suspended')
    await suspend(tobi.publisher.id)
    expect(await myPetsSurveyAs(tobi.publisher.client)).toEqual([])
  })

  it('borrar la cuenta que respondió no cambia ningún número (FR-044)', async () => {
    const reader = await admin()
    const respondent = await person(1, 'Quien responde')
    const rejected = await scene('sent')
    const id = await insertApplication(respondent, rejected.pet, rejected.publisher)
    await reject(rejected.publisher, id, 'housing')
    const offer = await pendingFor(respondent, 'not_chosen', id)
    expect((await answerAs(respondent.client, offer, 'maybe', 'sigo buscando')).outcome).toBe(
      'answered',
    )
    const before = await summaryAs(reader.client)
    await respondent.cleanup()
    expect(await offersOf(respondent.id)).toEqual([])
    expect(await summaryAs(reader.client)).toEqual(before)
  })
})

describeDb('Encuestas, para quien administra (R12)', () => {
  const written: string[] = []

  // Una solicitud rechazada con su encuesta pendiente, de una persona nueva cada vez.
  async function notChosenOffer() {
    const rejected = await scene('sent')
    await reject(rejected.publisher, rejected.id, 'housing')
    const offer = await pendingFor(rejected.applicant, 'not_chosen', rejected.id)
    return { client: rejected.applicant.client, offer }
  }

  afterEach(async () => {
    await db().from('survey_answers').delete().in('id', written.splice(0))
  })

  // Covers: US3-AS3
  it('cuenta las ofrecidas, las respondidas, las cerradas y cada opción de su momento', async () => {
    const reader = await admin()
    const before = momentIn(await summaryAs(reader.client), 'not_chosen')
    const first = await notChosenOffer()
    const body = `sigo buscando ${crypto.randomUUID()}`
    expect((await answerAs(first.client, first.offer, 'maybe', body)).outcome).toBe('answered')
    const second = await notChosenOffer()
    expect((await answerAs(second.client, second.offer, 'back_to_groups')).outcome).toBe('answered')
    const third = await notChosenOffer()
    expect((await dismissAs(third.client, third.offer)).outcome).toBe('dismissed')

    const rows = await summaryAs(reader.client)
    expect(rows.map((row) => [row.moment, row.option])).toEqual([
      ['gave', 'yes'],
      ['gave', 'maybe'],
      ['gave', 'no'],
      ['adopted', 'yes'],
      ['adopted', 'somewhat'],
      ['adopted', 'no'],
      ['not_chosen', 'yes'],
      ['not_chosen', 'maybe'],
      ['not_chosen', 'back_to_groups'],
    ])
    expect(momentIn(rows, 'not_chosen')).toEqual({
      offered: before.offered + 3,
      answered: before.answered + 2,
      dismissed: before.dismissed + 1,
      chosen: {
        yes: before.chosen.yes,
        maybe: (before.chosen.maybe ?? 0) + 1,
        back_to_groups: (before.chosen.back_to_groups ?? 0) + 1,
      },
    })
  })

  // Covers: US3-AS3
  it('las respuestas libres: solo con texto, de su momento, de la más nueva a la más vieja', async () => {
    const reader = await admin()
    const ids = {
      newest: '00000000-0000-4000-8000-000000000003',
      sameDayHigh: '00000000-0000-4000-8000-000000000002',
      sameDayLow: '00000000-0000-4000-8000-000000000001',
      noText: '00000000-0000-4000-8000-000000000004',
      otherMoment: '00000000-0000-4000-8000-000000000005',
    }
    written.push(...Object.values(ids))
    // Días que nadie más usa: las respuestas de las demás pruebas son de hoy.
    await insertAsOwner('survey_answers', [
      {
        id: ids.newest,
        moment: 'not_chosen',
        option: 'yes',
        body: 'la más nueva',
        answered_on: '2999-01-03',
      },
      {
        id: ids.sameDayHigh,
        moment: 'not_chosen',
        option: 'maybe',
        body: 'mismo día, id mayor',
        answered_on: '2999-01-02',
      },
      {
        id: ids.sameDayLow,
        moment: 'not_chosen',
        option: 'back_to_groups',
        body: 'mismo día, id menor',
        answered_on: '2999-01-02',
      },
      {
        id: ids.noText,
        moment: 'not_chosen',
        option: 'yes',
        body: null,
        answered_on: '2999-01-04',
      },
      {
        id: ids.otherMoment,
        moment: 'gave',
        option: 'yes',
        body: 'de otro momento',
        answered_on: '2999-01-05',
      },
    ])

    const first = await answersAs(reader.client, 'not_chosen', FIRST_PAGE, 2)
    expect(first).toEqual([
      { id: ids.newest, option: 'yes', body: 'la más nueva', answered_on: '2999-01-03' },
      {
        id: ids.sameDayHigh,
        option: 'maybe',
        body: 'mismo día, id mayor',
        answered_on: '2999-01-02',
      },
    ])
    const next = await answersAs(
      reader.client,
      'not_chosen',
      { on: '2999-01-02', id: ids.sameDayHigh },
      2,
    )
    expect(next[0]).toEqual({
      id: ids.sameDayLow,
      option: 'back_to_groups',
      body: 'mismo día, id menor',
      answered_on: '2999-01-02',
    })
    expect(next.map((row) => row.id)).not.toContain(ids.sameDayHigh)
    expect(await answersAs(reader.client, 'gave', FIRST_PAGE, 1)).toEqual([
      { id: ids.otherMoment, option: 'yes', body: 'de otro momento', answered_on: '2999-01-05' },
    ])
  })
})
