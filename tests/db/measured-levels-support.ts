// Lo que comparten las pruebas de las dos lecturas de la medición en la base (historia #236): una
// rescatista con un animal, solicitantes en cada nivel, una adopción con el seguimiento respondido
// —quien adoptó y quien lo dio—, una solicitud escrita con el servicio y las lecturas como cada
// sesión.
import { expect } from 'vitest'
import { insertApplication, petOf, type Person } from './applications-support'
import { answer, followUpPeople, stagedPhotos, tick, uruguayMoment } from './follow-ups-support'
import { db, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'

type Client = SyntheticUser['client']

export type MeasureRow = Functions['application_measure']['Returns'][number]

export function measurePeople(cleanups: SyntheticUser['cleanup'][]) {
  const people = followUpPeople(cleanups)
  return {
    ...people,
    /** Una solicitud de `applicant` a un animal nuevo de una rescatista con nivel 1. */
    applyToRescuer: async (applicant: Person) => {
      const { publisher, pet } = await people.publisherWithPet()
      return { publisher, pet, id: await insertApplication(applicant, pet, publisher) }
    },
    /**
     * Una adopción por el sitio a los 30 días con el seguimiento pedido: respondido salvo que se
     * pida pendiente. Quien adoptó es `adopter`; quien lo dio, `giver`.
     */
    followedAdoption: async (answered = true) => {
      const scene = await people.adoptedScene(uruguayMoment(30, 12, 0))
      await tick()
      if (answered) {
        const photos = await stagedPhotos(scene.chosen, scene.chosenId, 1)
        await answer(scene.chosen, scene.chosenId, photos)
      }
      return { adopter: scene.chosen, giver: scene.publisher }
    },
  }
}

/** Una solicitud de `applicant` a un animal de `publisher`, escrita con el servicio. */
export async function applyToPetOf(applicant: Person, publisher: Person) {
  const pet = await petOf(publisher)
  return { pet, id: await insertApplication(applicant, pet, publisher) }
}

/** Lo que la acción lee después de responder: con el servicio. */
export async function measureOf(applicationId: string): Promise<MeasureRow[]> {
  const { data, error } = await db().rpc('application_measure', { p_application: applicationId })
  expect(error).toBeNull()
  return data ?? []
}

export async function publisherLevelOf(code: string) {
  const { data, error } = await db().rpc('pet_publisher_level', { p_code: code })
  expect(error).toBeNull()
  return data
}

export async function measureAs(client: Client, applicationId: string) {
  const { data, error } = await client.rpc('application_measure', {
    p_application: applicationId,
  })
  return { rows: data ?? [], error }
}

export async function publisherLevelAs(client: Client, code: string) {
  const { data, error } = await client.rpc('pet_publisher_level', { p_code: code })
  return { level: data, error }
}
