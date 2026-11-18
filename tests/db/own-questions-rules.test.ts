// Las reglas de la pregunta propia en la base (historia #292): el largo con paridad, guardarla al
// publicar y al editar, y que una solicitud quede con la pregunta que se contestó y su respuesta. Si
// se rompen, quien publicó lee una respuesta al lado de una pregunta que la persona no vio.
import { afterEach, expect, it } from 'vitest'
import { OWN_QUESTION_MAX_LENGTH } from '../../src/lib/applications/rules'
import type { LitterState } from '../../src/lib/litters/types'
import type { PetState } from '../../src/lib/pets/types'
import { describeDb } from '../setup/env-report'
import { publisherViewAs } from './application-responses-support'
import { contextOf, detailAs } from './applications-support'
import { litterIn, petIn } from './deletion-reasons-support'
import { lastMomentId, withdrawHeld } from './held-applications-support'
import { openRequest, resolve } from './identity-support'
import { sql } from './listing-support'
import { measureOf } from './measured-levels-support'
import { suspend } from './moderation-support'
import {
  KIRA_ANSWER,
  KIRA_QUESTION,
  LITTER_QUESTION,
  heldOwnOf,
  holdOwn,
  litterQuestionOf,
  ownColumnsOf,
  ownQuestionPeople,
  ownSummaryAs,
  petQuestionOf,
  publishLitterWithQuestion,
  publishWithQuestion,
  saveLitterWithQuestion,
  saveWithQuestion,
  setLitterQuestion,
  setPetQuestion,
  submitOwn,
} from './own-questions-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, rescuer, applicants } = ownQuestionPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('el largo de la pregunta es el de lib/applications/', () => {
  // Covers: FR-001 (paridad)
  it('200 caracteres', async () => {
    const [row] = await sql<{ length: number }>(
      'select private.own_question_max_length() as length',
    )
    expect(row?.length).toBe(OWN_QUESTION_MAX_LENGTH)
  })

  // Covers: FR-001 (la base no guarda una de más)
  it('201 no entran', async () => {
    const { kira } = await rescuer()
    const long = await db()
      .from('pets')
      .update({ own_question: 'a'.repeat(201) })
      .eq('id', kira.petId)
    expect(long.error?.code).toBe('23514')
  })
})

describeDb('publicar y editar con la pregunta', () => {
  // Covers: US1-AS1, FR-001, FR-002
  it('publicar la guarda recortada; vacía o sin el campo, ninguna', async () => {
    const owner = await person(1, 'Carla')
    const asked = await publishWithQuestion(owner.id, `  ${KIRA_QUESTION}  `)
    expect(await petQuestionOf(asked.pet_id)).toBe(KIRA_QUESTION)
    const blank = await publishWithQuestion(owner.id, '   ')
    expect(await petQuestionOf(blank.pet_id)).toBeNull()
    const missing = await publishWithQuestion(owner.id, undefined)
    expect(await petQuestionOf(missing.pet_id)).toBeNull()
  })

  // Covers: FR-002 (cambiar o sacar en cualquier momento)
  it('editar la cambia y la saca', async () => {
    const owner = await person(1, 'Carla')
    const { pet_id: petId } = await publishWithQuestion(owner.id, undefined)
    expect((await saveWithQuestion(owner.id, petId, KIRA_QUESTION)).error).toBeNull()
    expect(await petQuestionOf(petId)).toBe(KIRA_QUESTION)
    expect((await saveWithQuestion(owner.id, petId, '¿Tenés patio?')).error).toBeNull()
    expect(await petQuestionOf(petId)).toBe('¿Tenés patio?')
    expect((await saveWithQuestion(owner.id, petId, '')).error).toBeNull()
    expect(await petQuestionOf(petId)).toBeNull()
  })

  // Covers: FR-007 (reintentar deja una sola publicación, con su pregunta)
  it('el mismo intento publica una vez', async () => {
    const owner = await person(1, 'Carla')
    const attempt = crypto.randomUUID()
    const first = await publishWithQuestion(owner.id, KIRA_QUESTION, attempt)
    const again = await publishWithQuestion(owner.id, KIRA_QUESTION, attempt, [])
    expect(again).toEqual({ pet_id: first.pet_id, already: true })
    const { data } = await db().from('pets').select('id, own_question').eq('attempt_id', attempt)
    expect(data).toEqual([{ id: first.pet_id, own_question: KIRA_QUESTION }])
  })
})

describeDb('mandar una solicitud con la pregunta', () => {
  // Covers: US1-AS1, US1-AS2, FR-011, FR-016
  it('con la misma pregunta guarda la pregunta y la respuesta', async () => {
    const { kira } = await rescuer()
    const { lucia } = await applicants()
    const sent = await submitOwn(lucia, kira.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    expect(sent).toMatchObject({ outcome: 'sent', own_question: KIRA_QUESTION })
    expect(await ownColumnsOf(lucia.id)).toEqual([
      { own_question: KIRA_QUESTION, own_answer: KIRA_ANSWER },
    ])
  })

  // Covers: FR-012 (la respuesta es obligatoria y de hasta 500)
  it('sin respuesta, de solo espacios o de 501, no sale', async () => {
    const { kira } = await rescuer()
    const { lucia } = await applicants()
    for (const ownAnswer of [undefined, ' \n ', 'a'.repeat(501)]) {
      // oxlint-disable-next-line no-await-in-loop -- una por vez, contra la misma persona
      const sent = await submitOwn(lucia, kira.code, { ownQuestion: KIRA_QUESTION, ownAnswer })
      expect(sent).toEqual({ outcome: 'answers_invalid', application_id: null, own_question: null })
    }
    expect(await ownColumnsOf(lucia.id)).toEqual([])
    const fits = await submitOwn(lucia, kira.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: 'a'.repeat(500),
    })
    expect(fits.outcome).toBe('sent')
  })

  // Covers: FR-011 (la pregunta se compara recortada)
  it('la pregunta que vio se compara sin los espacios de los bordes', async () => {
    const { kira } = await rescuer()
    const { lucia } = await applicants()
    const sent = await submitOwn(lucia, kira.code, {
      ownQuestion: ` ${KIRA_QUESTION} `,
      ownAnswer: KIRA_ANSWER,
    })
    expect(sent.outcome).toBe('sent')
  })

  // Covers: spec §Assumptions (la pregunta sacada mientras escribía)
  it('sin pregunta en el animal, lo recibido se ignora', async () => {
    const { pipo } = await rescuer()
    const { lucia } = await applicants()
    const sent = await submitOwn(lucia, pipo.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    expect(sent).toMatchObject({ outcome: 'sent', own_question: null })
    expect(await ownColumnsOf(lucia.id)).toEqual([{ own_question: null, own_answer: null }])
  })

  // Covers: FR-007 (reintentar deja una sola solicitud)
  it('el mismo intento da `already` y una sola fila, con su pregunta', async () => {
    const { kira } = await rescuer()
    const { lucia } = await applicants()
    const attempt = crypto.randomUUID()
    const own = { ownQuestion: KIRA_QUESTION, ownAnswer: KIRA_ANSWER, attempt }
    const first = await submitOwn(lucia, kira.code, own)
    const again = await submitOwn(lucia, kira.code, own)
    expect(again).toEqual({
      outcome: 'already',
      application_id: first.application_id,
      own_question: KIRA_QUESTION,
    })
    expect(await ownColumnsOf(lucia.id)).toHaveLength(1)
  })

  // Covers: FR-013 (la respuesta propia nunca se propone)
  it('las respuestas propuestas no traen la respuesta propia', async () => {
    const { kira, pipo } = await rescuer()
    const { lucia } = await applicants()
    await submitOwn(lucia, kira.code, { ownQuestion: KIRA_QUESTION, ownAnswer: KIRA_ANSWER })
    const [context] = await contextOf(lucia, pipo.code)
    expect(JSON.stringify(context?.last_answers)).not.toContain(KIRA_ANSWER)
    expect(context?.own_question).toBeNull()
  })

  // Covers: US1-AS1 (el cuestionario abre con la pregunta de hoy)
  it('el cuestionario trae la pregunta de hoy', async () => {
    const { kira } = await rescuer()
    const { lucia } = await applicants()
    expect((await contextOf(lucia, kira.code))[0]?.own_question).toBe(KIRA_QUESTION)
  })
})

describeDb('la pregunta de una camada', () => {
  // Covers: US2-AS1, FR-001, FR-002
  it('publicar la guarda recortada en la camada; vacía, ninguna; las crías no la copian', async () => {
    const owner = await person(1, 'Carla')
    const asked = await publishLitterWithQuestion(owner.id, `  ${LITTER_QUESTION}  `)
    expect(await litterQuestionOf(asked.litterId)).toBe(LITTER_QUESTION)
    const { data } = await db().from('pets').select('own_question').eq('litter_id', asked.litterId)
    expect(data).toEqual([{ own_question: null }, { own_question: null }])
    const blank = await publishLitterWithQuestion(owner.id, '   ')
    expect(await litterQuestionOf(blank.litterId)).toBeNull()
  })

  // Covers: US2-AS3, FR-002
  it('editar la cambia y la saca', async () => {
    const owner = await person(1, 'Carla')
    const litter = await publishLitterWithQuestion(owner.id, null)
    await saveLitterWithQuestion(owner.id, litter, LITTER_QUESTION)
    expect(await litterQuestionOf(litter.litterId)).toBe(LITTER_QUESTION)
    await saveLitterWithQuestion(owner.id, litter, '¿Tenés patio?')
    expect(await litterQuestionOf(litter.litterId)).toBe('¿Tenés patio?')
    await saveLitterWithQuestion(owner.id, litter, '')
    expect(await litterQuestionOf(litter.litterId)).toBeNull()
  })

  // Covers: US2-AS4, FR-014 (la pregunta es una sola, la de la camada)
  it('una cría no puede tener la suya', async () => {
    const { litter } = await rescuer()
    const own = await db()
      .from('pets')
      .update({ own_question: '¿Tenés patio?' })
      .eq('id', litter.young[0].id)
    expect(own.error?.code).toBe('23514')
  })

  // Covers: US2-AS1, FR-011, FR-014
  it('quien solicita cualquiera de las crías contesta la de la camada', async () => {
    const { litter } = await rescuer()
    const { lucia, bruno } = await applicants()
    for (const [applicant, young] of [
      [lucia, litter.young[0]],
      [bruno, litter.young[1]],
    ] as const) {
      // oxlint-disable-next-line no-await-in-loop -- una cría por vez
      expect((await contextOf(applicant, young.code))[0]?.own_question).toBe(LITTER_QUESTION)
      // oxlint-disable-next-line no-await-in-loop -- una cría por vez
      const missing = await submitOwn(applicant, young.code, { ownQuestion: LITTER_QUESTION })
      expect(missing.outcome).toBe('answers_invalid')
      // oxlint-disable-next-line no-await-in-loop -- una cría por vez
      const sent = await submitOwn(applicant, young.code, {
        ownQuestion: LITTER_QUESTION,
        ownAnswer: 'Sí, ya tengo veterinaria en el barrio.',
      })
      expect(sent).toMatchObject({ outcome: 'sent', own_question: LITTER_QUESTION })
    }
    expect(await ownColumnsOf(lucia.id)).toEqual([
      { own_question: LITTER_QUESTION, own_answer: 'Sí, ya tengo veterinaria en el barrio.' },
    ])
    expect(await ownColumnsOf(bruno.id)).toHaveLength(1)
  })

  // Covers: US2-AS2, FR-014 (la cría sumada después también la contesta)
  it('una cría sumada después de la pregunta también la contesta', async () => {
    const { publisher, litter } = await rescuer()
    const { lucia } = await applicants()
    const young = await saveLitterWithQuestion(publisher.id, litter, LITTER_QUESTION, {
      addYoung: 'Manchita',
    })
    const added = young.find((one) => one.name === 'Manchita')
    expect(added?.own_question).toBeNull()
    const code = added?.code ?? ''
    expect((await contextOf(lucia, code))[0]?.own_question).toBe(LITTER_QUESTION)
    const sent = await submitOwn(lucia, code, {
      ownQuestion: LITTER_QUESTION,
      ownAnswer: 'Sí, la anoto en el calendario.',
    })
    expect(sent).toMatchObject({ outcome: 'sent', own_question: LITTER_QUESTION })
  })

  // Covers: US2-AS3, FR-018 (cambiar o sacar no toca lo que ya llegó)
  it('cambiarla o sacarla muestra la nueva o ninguna y no toca lo que ya llegó', async () => {
    const { litter } = await rescuer()
    const { lucia, bruno } = await applicants()
    await submitOwn(lucia, litter.young[0].code, {
      ownQuestion: LITTER_QUESTION,
      ownAnswer: 'Sí.',
    })
    await setLitterQuestion(litter.litterId, '¿Tenés patio?')
    expect((await contextOf(bruno, litter.young[1].code))[0]?.own_question).toBe('¿Tenés patio?')
    await setLitterQuestion(litter.litterId, null)
    expect((await contextOf(bruno, litter.young[1].code))[0]?.own_question).toBeNull()
    expect(await ownColumnsOf(lucia.id)).toEqual([
      { own_question: LITTER_QUESTION, own_answer: 'Sí.' },
    ])
  })
})

const PATIO = '¿Tenés patio cerrado?'

describeDb('la pregunta cambió mientras escribía', () => {
  // Covers: US3-AS5, US3-AS8, FR-015
  it('con otra pregunta no guarda nada y devuelve la de hoy', async () => {
    const { kira } = await rescuer()
    const { lucia } = await applicants()
    await setPetQuestion(kira.petId, PATIO)
    const changed = await submitOwn(lucia, kira.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    expect(changed).toEqual({
      outcome: 'question_changed',
      application_id: null,
      own_question: PATIO,
    })
    expect(await ownColumnsOf(lucia.id)).toEqual([])
    const sent = await submitOwn(lucia, kira.code, { ownQuestion: PATIO, ownAnswer: 'Sí.' })
    expect(sent).toMatchObject({ outcome: 'sent', own_question: PATIO })
    expect(await ownColumnsOf(lucia.id)).toEqual([{ own_question: PATIO, own_answer: 'Sí.' }])
  })

  // Covers: US3-AS6, FR-015 (la pregunta se sumó mientras escribía)
  it('con una que se sumó mientras escribía, tampoco sale', async () => {
    const { pipo } = await rescuer()
    const { lucia } = await applicants()
    await setPetQuestion(pipo.petId, PATIO)
    expect(await submitOwn(lucia, pipo.code)).toEqual({
      outcome: 'question_changed',
      application_id: null,
      own_question: PATIO,
    })
    expect(await ownColumnsOf(lucia.id)).toEqual([])
  })

  // Covers: US3-AS9 (la misma pregunta es el mismo texto)
  it('la que volvió al texto que contestó sale', async () => {
    const { kira } = await rescuer()
    const { lucia } = await applicants()
    await setPetQuestion(kira.petId, PATIO)
    await setPetQuestion(kira.petId, KIRA_QUESTION)
    const sent = await submitOwn(lucia, kira.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    expect(sent).toMatchObject({ outcome: 'sent', own_question: KIRA_QUESTION })
  })
})

describeDb('cambiar o sacar la pregunta no toca lo que llegó', () => {
  // Covers: US3-AS1, US3-AS2, US3-AS3, US3-AS4, FR-018, FR-019
  it('cada solicitud guarda la que vio, y la de antes dice que llegó antes mientras haya pregunta', async () => {
    const { publisher, pipo } = await rescuer()
    const { lucia, bruno } = await applicants()
    const before = (await submitOwn(lucia, pipo.code)).application_id ?? ''
    await setPetQuestion(pipo.petId, KIRA_QUESTION)
    const answered = await submitOwn(bruno, pipo.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    const after = answered.application_id ?? ''
    const read = async (id: string) => (await publisherViewAs(publisher.client, id)).rows[0]
    const mine = async () => (await detailAs(bruno.client, after)).rows[0]
    const contested = { own_question: KIRA_QUESTION, own_answer: KIRA_ANSWER }

    expect(await read(before)).toMatchObject({
      own_question: null,
      own_answer: null,
      asks_now: true,
    })
    expect(await read(after)).toMatchObject({ ...contested, asks_now: true })

    await setPetQuestion(pipo.petId, PATIO)
    expect(await read(after)).toMatchObject(contested)
    expect(await mine()).toMatchObject(contested)

    await setPetQuestion(pipo.petId, null)
    expect(await read(before)).toMatchObject({ own_question: null, asks_now: false })
    expect(await read(after)).toMatchObject({ ...contested, asks_now: false })
    expect(await mine()).toMatchObject(contested)
  })
})

describeDb('la que espera la identidad, con la pregunta', () => {
  async function scene() {
    const found = await rescuer()
    for (const pet of [found.kira, found.pipo]) {
      // oxlint-disable-next-line no-await-in-loop -- uno por vez
      const { error } = await db().from('pets').update({ required_level: 2 }).eq('id', pet.petId)
      expect(error).toBeNull()
    }
    const bruno = await person(1, 'Bruno')
    const requestId = await openRequest(bruno.id)
    return { ...found, bruno, requestId }
  }

  // Covers: US3-AS11, FR-015 (dejarla escrita compara la pregunta igual que mandarla)
  it('con otra pregunta no queda escrita; con la de hoy guarda pregunta y respuesta', async () => {
    const { kira, bruno } = await scene()
    expect(await holdOwn(bruno, kira.code, { ownQuestion: PATIO, ownAnswer: 'Sí.' })).toEqual({
      outcome: 'question_changed',
      held_id: null,
      application_id: null,
      own_question: KIRA_QUESTION,
    })
    expect(await heldOwnOf(bruno.id)).toEqual([])
    const held = await holdOwn(bruno, kira.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    expect(held).toMatchObject({ outcome: 'held', own_question: KIRA_QUESTION })
    expect(await heldOwnOf(bruno.id)).toEqual([
      { status: 'waiting', own_question: KIRA_QUESTION, own_answer: KIRA_ANSWER },
    ])
  })

  // Covers: US3-AS10, US3-AS11, FR-018, FR-019
  it('al salir lleva la que contestó aunque hoy sea otra; una escrita sin pregunta sale sin ella', async () => {
    const { publisher, kira, pipo, bruno, requestId } = await scene()
    await holdOwn(bruno, kira.code, { ownQuestion: KIRA_QUESTION, ownAnswer: KIRA_ANSWER })
    await holdOwn(bruno, pipo.code)
    await setPetQuestion(kira.petId, PATIO)
    await setPetQuestion(pipo.petId, PATIO)

    const boss = await admin()
    expect((await resolve(requestId, boss.id)).decision).toBe('approved')

    const { data, error } = await db()
      .from('applications')
      .select('id, pet_id, own_question, own_answer')
      .eq('applicant_id', bruno.id)
    expect(error).toBeNull()
    const byPet = new Map((data ?? []).map((row) => [row.pet_id, row]))
    expect(byPet.get(kira.petId)).toMatchObject({
      own_question: KIRA_QUESTION,
      own_answer: KIRA_ANSWER,
    })
    expect(byPet.get(pipo.petId)).toMatchObject({ own_question: null, own_answer: null })
    const late = await publisherViewAs(publisher.client, byPet.get(pipo.petId)?.id ?? '')
    expect(late.rows[0]).toMatchObject({ own_question: null, asks_now: true })
  })

  // Covers: research R2 (al no salir, la respuesta propia se pierde con las demás)
  it('al no salir quedan sin pregunta ni respuesta', async () => {
    const { kira, bruno } = await scene()
    const held = await holdOwn(bruno, kira.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    expect((await withdrawHeld(bruno, held.held_id ?? '')).outcome).toBe('withdrawn')
    expect(await heldOwnOf(bruno.id)).toEqual([
      { status: 'lapsed', own_question: null, own_answer: null },
    ])
  })
})

describeDb('la medición dice si contestó una pregunta propia', () => {
  // Covers: US5-AS3, FR-029 (aceptar, rechazar y la primera respuesta lo leen de acá)
  it('la medida de una solicitud dice si contestó una, sí o no, nunca el texto', async () => {
    const { kira, pipo, litter } = await rescuer()
    const { lucia, bruno } = await applicants()
    const forKira = await submitOwn(lucia, kira.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    const forPipo = await submitOwn(lucia, pipo.code)
    const forYoung = await submitOwn(bruno, litter.young[0]?.code ?? '', {
      ownQuestion: LITTER_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    const [kiraRow, pipoRow, youngRow] = await Promise.all(
      [forKira, forPipo, forYoung].map((sent) => measureOf(sent.application_id ?? '')),
    )
    expect(kiraRow).toEqual([expect.objectContaining({ own_question: true })])
    expect(pipoRow).toEqual([expect.objectContaining({ own_question: false })])
    expect(youngRow).toEqual([expect.objectContaining({ own_question: true })])
  })

  // Covers: US5-AS3 (cambiar la pregunta después no cambia lo que se mide de las que llegaron)
  it('sacarle la pregunta al animal no cambia lo que se mide de la que la contestó', async () => {
    const { kira } = await rescuer()
    const { lucia } = await applicants()
    const sent = await submitOwn(lucia, kira.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    await setPetQuestion(kira.petId, null)
    expect((await measureOf(sent.application_id ?? ''))[0]?.own_question).toBe(true)
  })

  // Covers: US5-AS2, FR-029 (la que sale sola trae el dato en su momento de solicitud mandada)
  it('la que sale sola anota si contestó una; la que no sale, ninguno', async () => {
    const found = await rescuer()
    for (const pet of [found.kira, found.pipo]) {
      // oxlint-disable-next-line no-await-in-loop -- uno por vez
      const { error } = await db().from('pets').update({ required_level: 2 }).eq('id', pet.petId)
      expect(error).toBeNull()
    }
    const [bruno, lucia] = await Promise.all([person(1, 'Bruno'), person(1, 'Lucía')])
    const [brunoRequest] = await Promise.all([openRequest(bruno.id), openRequest(lucia.id)])
    const since = await lastMomentId()
    await holdOwn(bruno, found.kira.code, { ownQuestion: KIRA_QUESTION, ownAnswer: KIRA_ANSWER })
    await holdOwn(bruno, found.pipo.code)
    const withdrawn = await holdOwn(lucia, found.kira.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    expect((await withdrawHeld(lucia, withdrawn.held_id ?? '')).outcome).toBe('withdrawn')
    expect((await resolve(brunoRequest, (await admin()).id)).decision).toBe('approved')

    const moments = await sql<{ kind: string; own_question: boolean | null }>(
      `select kind, own_question from public.held_application_moments
        where id > ${since} order by kind, own_question`,
    )
    expect(moments).toEqual([
      { kind: 'lapsed', own_question: null },
      { kind: 'released', own_question: false },
      { kind: 'released', own_question: true },
    ])
  })
})

describeDb('«Lo que preguntan quienes publican» en Encuestas', () => {
  // Las pruebas de base corren un archivo por vez: lo que cambia entre antes y después es de esta
  // prueba, y sus preguntas llevan una marca propia para encontrarlas entre las que ya había.
  async function summaryOf(client: SyntheticUser['client']) {
    const { rows, error } = await ownSummaryAs(client)
    expect(error).toBeNull()
    expect(rows).toHaveLength(1)
    return rows[0] ?? { published: 0, with_question: 0, questions: [] }
  }

  async function petWith(ownerId: string, state: PetState, question: string | null) {
    const pet = await petIn(ownerId, state)
    await setPetQuestion(pet.petId, question)
  }

  async function litterWith(ownerId: string, state: LitterState, question: string) {
    const litter = await litterIn(ownerId, state)
    await setLitterQuestion(litter.litterId, question)
  }

  // Covers: US4-AS1, US4-AS3, US4-AS4, FR-022
  it('cuenta lo publicado hoy, la camada una vez, y lista sus preguntas de la A a la Z', async () => {
    const boss = await admin()
    const carla = await person(1, 'Carla')
    const suspended = await person(1, 'Suspendida')
    const mark = crypto.randomUUID()
    const asked = (text: string) => `${text} ${mark}`
    const before = await summaryOf(boss.client)

    await petWith(carla.id, 'available', asked('zorro: ¿tenés patio?'))
    await petWith(carla.id, 'in_process', asked('Beta: ¿vivís en casa?'))
    await petWith(carla.id, 'paused', asked('alfa: ¿trabajás afuera?'))
    await petWith(carla.id, 'expired', asked('delta: ¿tenés otros gatos?'))
    await petWith(carla.id, 'available', null)
    await petWith(carla.id, 'adopted', asked('adoptada'))
    await petWith(carla.id, 'taken_down', asked('dada de baja'))
    await litterWith(carla.id, 'available', asked('camada: ¿la vacuna de los 3 meses?'))
    await litterWith(carla.id, 'paused', asked('Charlie: ¿tenés jardín?'))
    await litterWith(carla.id, 'expired', asked('eco: ¿tenés balcón con red?'))
    await litterWith(carla.id, 'adopted', asked('camada adoptada'))
    await litterWith(carla.id, 'taken_down', asked('camada dada de baja'))
    await petWith(suspended.id, 'available', asked('de una cuenta suspendida'))
    await suspend(suspended.id)

    const after = await summaryOf(boss.client)
    expect(after.published - before.published).toBe(8)
    expect(after.with_question - before.with_question).toBe(7)
    expect(after.questions.filter((question) => question.endsWith(mark))).toEqual([
      asked('alfa: ¿trabajás afuera?'),
      asked('Beta: ¿vivís en casa?'),
      asked('camada: ¿la vacuna de los 3 meses?'),
      asked('Charlie: ¿tenés jardín?'),
      asked('delta: ¿tenés otros gatos?'),
      asked('eco: ¿tenés balcón con red?'),
      asked('zorro: ¿tenés patio?'),
    ])
  })

  // Covers: US4-AS2 (sin preguntas, la cuenta sube y la lista no)
  it('una publicación sin pregunta se cuenta y no suma ninguna a la lista', async () => {
    const boss = await admin()
    const carla = await person(1, 'Carla')
    const before = await summaryOf(boss.client)
    await petWith(carla.id, 'available', null)
    const after = await summaryOf(boss.client)
    expect(after.published - before.published).toBe(1)
    expect(after.with_question).toBe(before.with_question)
    expect(after.questions).toEqual(before.questions)
  })
})
