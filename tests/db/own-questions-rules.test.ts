// Las reglas de la pregunta propia en la base (historia #292): el largo con paridad, guardarla al
// publicar y al editar, y que una solicitud quede con la pregunta que se contestó y su respuesta. Si
// se rompen, quien publicó lee una respuesta al lado de una pregunta que la persona no vio.
import { afterEach, expect, it } from 'vitest'
import { OWN_QUESTION_MAX_LENGTH } from '../../src/lib/applications/rules'
import { describeDb } from '../setup/env-report'
import { contextOf } from './applications-support'
import { sql } from './listing-support'
import {
  KIRA_ANSWER,
  KIRA_QUESTION,
  LITTER_QUESTION,
  litterQuestionOf,
  ownColumnsOf,
  ownQuestionPeople,
  petQuestionOf,
  publishLitterWithQuestion,
  publishWithQuestion,
  saveLitterWithQuestion,
  saveWithQuestion,
  setLitterQuestion,
  submitOwn,
} from './own-questions-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, rescuer, applicants } = ownQuestionPeople(cleanups)

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
