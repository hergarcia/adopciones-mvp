// Quién puede leer lo que mide la historia #236 (constitución §V): las dos funciones devuelven el
// nivel y el sí o no de cualquiera por un id, así que solo las corre el servicio. Un visitante y las
// personas de la solicitud lo intentan, también con el id de su propia solicitud. La base local
// solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  measureAs,
  measureOf,
  measurePeople,
  publisherLevelAs,
  publisherLevelOf,
} from './measured-levels-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, applyToRescuer } = measurePeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('las lecturas de la medición, solo para el servicio', () => {
  it('un visitante, quien solicitó, quien publicó y otra persona no pueden correrlas', async () => {
    const applicant = await person(2, 'Quien solicita')
    const { publisher, pet, id } = await applyToRescuer(applicant)
    const other = await person(1, 'Otra')
    const callers = [
      ['un visitante', anonClient()],
      ['quien solicitó', applicant.client],
      ['quien publicó', publisher.client],
      ['otra persona', other.client],
    ] as const

    const results = await Promise.all(
      callers.map(async ([who, client]) => {
        const [measure, level] = await Promise.all([
          measureAs(client, id),
          publisherLevelAs(client, pet.code),
        ])
        return [who, measure.error?.code, measure.rows, level.error?.code, level.level]
      }),
    )
    expect(results).toEqual(callers.map(([who]) => [who, '42501', [], '42501', null]))
  })

  it('el servicio sí', async () => {
    const applicant = await person(2, 'Quien solicita')
    const { pet, id } = await applyToRescuer(applicant)
    expect(await measureOf(id)).toEqual([
      { applicant_level: 2, applicant_follow_up: false, publisher_level: 1 },
    ])
    expect(await publisherLevelOf(pet.code)).toBe(1)
  })
})
