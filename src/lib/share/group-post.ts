import type { LitterState, YoungState } from '@/lib/litters/types'
import type { PetState } from '@/lib/pets/types'

/** Disponible o en proceso: lo que hoy recibe solicitudes. */
export function receivesApplications(state: PetState | YoungState): boolean {
  return state === 'available' || state === 'in_process'
}

// El texto para el grupo es de quien publicó, y solo cuando alguien puede pedir el animal hoy
// (decisión 2026-10-29): a la vista ya dice que quien publicó tiene el teléfono verificado.
export function offersPetGroupPost(pet: {
  isOwner: boolean
  visibility: string
  state: PetState
}): boolean {
  return pet.isOwner && pet.visibility === 'listed' && receivesApplications(pet.state)
}

/** Una camada a la vista con al menos una cría que recibe solicitudes. */
export function offersLitterGroupPost(litter: {
  isOwner: boolean
  visibility: string
  state: LitterState
  young: readonly { state: YoungState }[]
}): boolean {
  return (
    litter.isOwner &&
    litter.visibility === 'listed' &&
    litter.state === 'available' &&
    litter.young.some((one) => receivesApplications(one.state))
  )
}

/** Cada parte ya traducida; null o vacía, no va. */
export type GroupPostParts = {
  urgent: string | null
  title: string
  inProcess: string | null
  facts: string
  livesWith: string | null
  zone: string
  description: string | null
  /** De una camada: cuántas quedan y una línea por cría. */
  young: readonly string[]
  publisher: string | null
  invite: string
  url: string
}

// En bloques separados por un renglón vacío, como se escribe un posteo; un bloque sin nada no deja
// su renglón (US2: sin descripción no queda un hueco).
export function groupPostText(parts: GroupPostParts): string {
  const blocks = [
    [parts.urgent, parts.title, parts.inProcess],
    [parts.facts, parts.livesWith, parts.zone],
    [parts.description?.trim() ?? null],
    parts.young,
    [parts.publisher, parts.invite, parts.url],
  ]
  return blocks
    .map((lines) => lines.filter((line) => line !== null && line !== '').join('\n'))
    .filter((block) => block !== '')
    .join('\n\n')
}
