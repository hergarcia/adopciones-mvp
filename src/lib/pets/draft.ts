import { z } from 'zod'
import { DRAFT_TTL_DAYS } from './rules'
import type { PetFormValues } from './types'

/** Lo escrito sin publicar, en el navegador y atado a la cuenta que lo escribió (FR-024). */
export type PetDraft = {
  v: 1
  accountId: string
  attemptId: string
  /** Cuándo se cargó el primer dato: la medición cuenta desde ahí aunque haya habido recargas. */
  startedAt: number
  updatedAt: number
  fields: PetFormValues
}

const TTL_MS = DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000

const text = z.string()

// Lo que se guardó tiene que tener la forma del formulario, campo por campo; lo que sobra se
// descarta.
const FIELDS = z.object({
  name: text,
  species: text,
  sex: text,
  ageValue: text,
  ageUnit: text,
  size: text,
  isNeutered: text,
  vaccines: text,
  hasChip: text,
  goodWithKids: text,
  goodWithDogs: text,
  goodWithCats: text,
  description: text,
  department: text,
  locality: text,
  isUrgent: z.boolean(),
}) satisfies z.ZodType<PetFormValues>

const DRAFT = z.object({
  v: z.literal(1),
  accountId: z.string(),
  attemptId: z.string(),
  startedAt: z.number(),
  updatedAt: z.number(),
  fields: FIELDS,
})

// Stryker disable BlockStatement: sin el return, el catch devuelve undefined y el schema lo rechaza igual
function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
// Stryker restore BlockStatement

// Solo para la misma cuenta y dentro de los 30 días desde la última vez que se escribió. Uno roto
// o de otra versión se descarta sin romper nada: el formulario arranca vacío.
export function readPetDraft(raw: string, accountId: string, now: number): PetDraft | null {
  const draft = DRAFT.safeParse(parseJson(raw))
  if (!draft.success || draft.data.accountId !== accountId) return null
  return now - draft.data.updatedAt < TTL_MS ? draft.data : null
}

// «Publicación empezada» sale con el primer dato o la primera foto en un formulario vacío, y no
// cuando arranca con lo escrito recuperado, que es la misma carga que ya empezó (FR-028).
export function shouldTrackStart(state: { startedAt: number | null; restored: boolean }): boolean {
  return state.startedAt === null && !state.restored
}
