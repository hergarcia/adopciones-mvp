import type { InboxPet, PetApplicationRow } from './types'

function byLatest(a: InboxPet, b: InboxPet): number {
  return b.lastSentAt.localeCompare(a.lastSentAt)
}

function rank(pet: InboxPet): number {
  if (pet.fresh > 0) return 0
  return pet.waiting > 0 ? 1 : 2
}

// Solicitudes (spec §Pantallas): primero los animales con nuevas, después los que tienen alguna
// esperando respuesta y al final los demás, cada grupo por la solicitud más reciente. Lo que la
// rescatista busca al abrirla es lo que no vio.
export function inboxOrder(pets: readonly InboxPet[]): InboxPet[] {
  return [...pets].sort((a, b) => rank(a) - rank(b) || byLatest(a, b))
}

export type PetApplicationGroups<T> = { waiting: T[]; accepted: T[]; closed: T[] }

// Las de un animal (FR-003): las que esperan respuesta, después las aceptadas y después las demás,
// cada grupo de la más vieja a la más nueva, así la que más espera queda arriba.
export function petApplicationsOrder<T extends Pick<PetApplicationRow, 'status' | 'sentAt'>>(
  applications: readonly T[],
): PetApplicationGroups<T> {
  const sorted = [...applications].sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  return {
    waiting: sorted.filter((application) => application.status === 'sent'),
    accepted: sorted.filter((application) => application.status === 'accepted'),
    closed: sorted.filter(
      (application) => application.status !== 'sent' && application.status !== 'accepted',
    ),
  }
}
