import type { HandoverInput } from '@/lib/schemas/adoption'
import { foundViaOf } from './found-via'

/** «Se lo di a alguien que no vino por el sitio». */
export const OUTSIDE = 'outside'

type Request = {
  petId: string
  attemptId: string
  /** La solicitud elegida, o `OUTSIDE`. */
  choice: string
  /** Lo elegido en «¿Por dónde te encontró?»; vacío si nada. */
  foundVia: string
}

// Con una persona elegida no viaja canal aunque se haya tocado una opción en el camino por fuera:
// esa adopción vino por el sitio (FR-010).
export function handoverRequest({ petId, attemptId, choice, foundVia }: Request): HandoverInput {
  if (choice !== OUTSIDE) return { petId, applicationId: choice, attemptId, foundVia: null }
  return { petId, applicationId: null, attemptId, foundVia: foundViaOf(foundVia) }
}
