// El nivel exigido y las reglas del cuestionario (historia #63). Primera parte: la base valida con
// los mismos números y las mismas preguntas que lib/applications/ (research R4).
import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../src/lib/applications/questionnaire'
import { ANSWER_MAX_LENGTH, MAX_ACTIVE_APPLICATIONS } from '../../src/lib/applications/rules'
import { validateApplication } from '../../src/lib/schemas/application'
import { describeDb } from '../setup/env-report'
import { ANSWERS } from './applications-support'
import { sql } from './listing-support'

const literal = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`

async function dbAccepts(answers: unknown, neutered: boolean): Promise<boolean> {
  const [row] = await sql<{ valid: boolean }>(
    `select private.application_answers_valid(${literal(answers)}, ${neutered}) as valid`,
  )
  return row?.valid ?? false
}

describeDb('las reglas de la base son las de lib/applications/', () => {
  // Covers: FR-050, FR-021 (paridad de los números)
  it('3 activas y 500 caracteres', async () => {
    const [row] = await sql<{ max: number; length: number }>(
      'select private.max_active_applications() as max, private.answer_max_length() as length',
    )
    expect(row).toEqual({ max: MAX_ACTIVE_APPLICATIONS, length: ANSWER_MAX_LENGTH })
  })

  // Covers: FR-020, FR-026 (paridad del cuestionario)
  it('las mismas preguntas, en el mismo orden, con las mismas opciones', async () => {
    const rows = await sql<{ id: string; kind: string; options: string[] | null }>(
      'select id, kind, options from private.application_questions()',
    )
    expect(rows).toEqual(
      QUESTIONS.map((question) => ({
        id: question.id,
        kind: question.kind,
        options: question.kind === 'choice' ? [...question.options] : null,
      })),
    )
  })

  // Covers: FR-021, FR-022 (la base acepta y rechaza lo mismo que el schema)
  describe('application_answers_valid y validateApplication dicen lo mismo', () => {
    const cases: { name: string; answers: Record<string, unknown>; neutered: boolean }[] = [
      { name: 'completo, castrado', answers: ANSWERS, neutered: true },
      {
        name: 'sin castrar con compromiso',
        answers: { ...ANSWERS, neuter_commitment: 'yes' },
        neutered: false,
      },
      { name: 'sin castrar sin compromiso', answers: ANSWERS, neutered: false },
      {
        name: 'alquilada con permiso',
        answers: { ...ANSWERS, housing_tenure: 'rented', rental_allows_pets: 'no' },
        neutered: true,
      },
      {
        name: 'alquilada sin permiso',
        answers: { ...ANSWERS, housing_tenure: 'rented' },
        neutered: true,
      },
      {
        name: 'una opción desconocida',
        answers: { ...ANSWERS, vet_budget: 'mucha' },
        neutered: true,
      },
      {
        name: '500 caracteres',
        answers: { ...ANSWERS, experience: 'a'.repeat(ANSWER_MAX_LENGTH) },
        neutered: true,
      },
      {
        name: '501 caracteres',
        answers: { ...ANSWERS, experience: 'a'.repeat(ANSWER_MAX_LENGTH + 1) },
        neutered: true,
      },
      { name: 'solo espacios', answers: { ...ANSWERS, household: '   ' }, neutered: true },
      {
        name: 'una pregunta que falta',
        answers: { ...ANSWERS, household: undefined },
        neutered: true,
      },
    ]

    it.each(cases)('$name', async ({ answers, neutered }) => {
      const schema = validateApplication(answers, { isNeutered: neutered })
      expect(await dbAccepts(answers, neutered)).toBe(schema.ok)
    })
  })

  // Covers: FR-022 (la base, que es la última puerta, no acepta lo que el schema descartaría)
  it('una condicional que no corresponde, o una clave de más, no pasan en la base', async () => {
    expect(await dbAccepts({ ...ANSWERS, rental_allows_pets: 'yes' }, true)).toBe(false)
    expect(await dbAccepts({ ...ANSWERS, neuter_commitment: 'yes' }, true)).toBe(false)
    expect(await dbAccepts({ ...ANSWERS, phone: '099123456' }, true)).toBe(false)
    expect(await dbAccepts({ ...ANSWERS, household: 3 }, true)).toBe(false)
    expect(await dbAccepts([ANSWERS], true)).toBe(false)
  })
})
