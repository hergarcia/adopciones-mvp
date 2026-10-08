// Lo que comparten las pruebas de la entrega y del compromiso en la base (historia #67): una
// publicadora con un animal, dos personas con la solicitud aceptada, una esperando respuesta y otra
// persona sin nada; marcar adoptado con el servicio, como la aplicación, y las lecturas como cada
// sesión.
import { expect } from 'vitest'
import { markAccepted } from './application-responses-support'
import {
  applicationPeople,
  insertApplication,
  type PetOptions,
  type Person,
} from './applications-support'
import type { ListedPet } from './listing-support'
import { db, firstRow, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'

type Client = SyntheticUser['client']

export type Marked = Functions['mark_pet_adopted']['Returns'][number]
export type CandidateRow = Functions['handover_candidates']['Returns'][number]
export type PetAdoptionRow = Functions['my_pet_adoptions']['Returns'][number]
export type AdoptionOfRow = Functions['adoption_of']['Returns'][number]

export type HandoverScene = {
  publisher: Person
  pet: ListedPet
  /** La que se elige: aceptada. */
  chosen: Person
  chosenId: string
  /** La otra aceptada, que no se elige. */
  other: Person
  otherId: string
  /** Una que espera respuesta. */
  waiting: Person
  waitingId: string
}

export function adoptionPeople(cleanups: SyntheticUser['cleanup'][]) {
  const people = applicationPeople(cleanups)
  return {
    ...people,
    /** Una publicadora con un animal, dos aceptadas y una que espera respuesta. */
    handoverScene: async (options: PetOptions = {}): Promise<HandoverScene> => {
      const { publisher, pet } = await people.publisherWithPet(options)
      const [chosen, other, waiting] = await Promise.all([
        people.person(1, 'Ana'),
        people.person(1, 'Diego'),
        people.person(1, 'Esperando'),
      ])
      const chosenId = await insertApplication(chosen, pet, publisher)
      await markAccepted(chosenId)
      const otherId = await insertApplication(other, pet, publisher)
      await markAccepted(otherId)
      const waitingId = await insertApplication(waiting, pet, publisher)
      return { publisher, pet, chosen, chosenId, other, otherId, waiting, waitingId }
    },
  }
}

/** Marcar adoptado como lo hace la aplicación: con el servicio y el id de quien publicó. */
export async function markAdopted(
  publisher: { id: string },
  petId: string,
  applicationId: string | null,
  attempt: string = crypto.randomUUID(),
): Promise<Marked> {
  const { data, error } = await db().rpc('mark_pet_adopted', {
    p_owner: publisher.id,
    p_pet: petId,
    p_attempt: attempt,
    ...(applicationId === null ? {} : { p_application: applicationId }),
  })
  expect(error).toBeNull()
  return firstRow(data, 'mark_pet_adopted')
}

/** Las filas de `adoptions` de un animal, leídas con el servicio. */
export async function adoptionsOf(petId: string) {
  const { data, error } = await db()
    .from('adoptions')
    .select('*')
    .eq('pet_id', petId)
    .order('marked_at')
  expect(error).toBeNull()
  return data ?? []
}

export async function statusOf(applicationId: string) {
  const { data, error } = await db()
    .from('applications')
    .select('status, close_reason')
    .eq('id', applicationId)
    .single()
  expect(error).toBeNull()
  return data
}

export async function candidatesAs(client: Client, petId: string) {
  const { data, error } = await client.rpc('handover_candidates', { p_pet: petId })
  const rows: CandidateRow[] = data ?? []
  return { rows, error }
}

export async function myPetAdoptionsAs(client: Client) {
  const { data, error } = await client.rpc('my_pet_adoptions')
  const rows: PetAdoptionRow[] = data ?? []
  return { rows, error }
}

export async function adoptionOfAs(client: Client, applicationId: string) {
  const { data, error } = await client.rpc('adoption_of', { p_application: applicationId })
  const rows: AdoptionOfRow[] = data ?? []
  return { rows, error }
}
