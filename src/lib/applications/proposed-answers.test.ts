// Covers: US2-AS1, FR-025, FR-042, spec §Edge Cases «Respuestas propuestas que no aplican» y
// «Borrador y respuestas propuestas a la vez»
import { describe, expect, it } from 'vitest'
import { proposedAnswers, startingAnswers } from './proposed-answers'
import type { Answers } from './questionnaire'

const LAST: Answers = {
  housing_type: 'apartment',
  housing_tenure: 'owned',
  outdoor_space: 'netted_balcony',
  household: 'Mi pareja y yo.',
  other_pets: 'Ninguno.',
  hours_alone: '4_to_8',
  moving_plan: 'Se viene conmigo.',
  experience: 'Tuve una perra doce años.',
  vet_budget: 'tight',
  why_this_pet: 'Porque es tranquilo.',
}

const { why_this_pet: _why, ...WITHOUT_WHY } = LAST

describe('proposedAnswers', () => {
  it('sin una solicitud anterior no propone nada', () => {
    expect(proposedAnswers(null, { isNeutered: true })).toBeNull()
  })

  it('propone todo lo de la última, salvo «por qué este animal»', () => {
    expect(proposedAnswers(LAST, { isNeutered: true })).toStrictEqual(WITHOUT_WHY)
  })

  it('el compromiso de castración, solo si el animal nuevo no está castrado', () => {
    const last = { ...LAST, neuter_commitment: 'yes' }
    expect(proposedAnswers(last, { isNeutered: true })).toStrictEqual(WITHOUT_WHY)
    expect(proposedAnswers(last, { isNeutered: false })).toStrictEqual({
      ...WITHOUT_WHY,
      neuter_commitment: 'yes',
    })
  })

  it('una pregunta que la anterior no tenía arranca vacía', () => {
    const proposed = proposedAnswers(LAST, { isNeutered: false })
    expect(proposed).toStrictEqual(WITHOUT_WHY)
    expect(proposed).not.toHaveProperty('neuter_commitment')
  })

  it('el permiso del dueño va con la vivienda alquilada, y no sin ella', () => {
    const rented = { ...LAST, housing_tenure: 'rented', rental_allows_pets: 'yes' }
    expect(proposedAnswers(rented, { isNeutered: true })).toStrictEqual({
      ...WITHOUT_WHY,
      housing_tenure: 'rented',
      rental_allows_pets: 'yes',
    })
    const stray = { ...LAST, rental_allows_pets: 'yes' }
    expect(proposedAnswers(stray, { isNeutered: true })).toStrictEqual(WITHOUT_WHY)
  })

  it('una opción que ya no existe no se propone; un texto sí, tal cual', () => {
    const { hours_alone: _hours, ...rest } = WITHOUT_WHY
    expect(
      proposedAnswers(
        { ...LAST, hours_alone: 'all_day', household: 'Solo yo.' },
        { isNeutered: true },
      ),
    ).toStrictEqual({ ...rest, household: 'Solo yo.' })
  })

  it('si de la anterior no queda nada para proponer, nada', () => {
    expect(proposedAnswers({ why_this_pet: 'Porque sí.' }, { isNeutered: true })).toBeNull()
    expect(proposedAnswers({}, { isNeutered: true })).toBeNull()
  })

  it('con una sola respuesta para proponer, la propone', () => {
    expect(proposedAnswers({ household: 'Solo yo.' }, { isNeutered: true })).toStrictEqual({
      household: 'Solo yo.',
    })
  })
})

describe('startingAnswers', () => {
  const draft: Answers = { household: 'Lo que estaba escribiendo.' }
  const proposed: Answers = { household: 'Mi pareja y yo.' }

  it('el borrador gana sobre las propuestas', () => {
    expect(startingAnswers(draft, proposed)).toStrictEqual({ answers: draft, from: 'draft' })
    expect(startingAnswers(draft, null)).toStrictEqual({ answers: draft, from: 'draft' })
  })

  it('sin borrador, las propuestas', () => {
    expect(startingAnswers(null, proposed)).toStrictEqual({ answers: proposed, from: 'proposed' })
  })

  it('sin ninguno de los dos, vacío', () => {
    expect(startingAnswers(null, null)).toStrictEqual({ answers: {}, from: 'blank' })
  })
})
