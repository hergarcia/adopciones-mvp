import { z } from 'zod'
import { APPLICATION_DRAFT_PREFIX } from '@/lib/drafts/account-drafts'
import { DRAFT_TTL_DAYS } from '@/lib/pets/rules'
import { QUESTION_IDS, type Answers } from './questionnaire'

/** Lo escrito sin enviar en el cuestionario de un animal, atado a la cuenta y al intento (R7). */
export type ApplicationDraft = {
  v: 1
  accountId: string
  attemptId: string
  /** La primera respuesta tocada: lo que tardó se mide desde ahí aunque haya habido recargas. */
  startedAt: number
  updatedAt: number
  answers: Answers
}

const TTL_MS = DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000

// Lo que no es una pregunta se descarta; una respuesta que no es texto rompe el borrador entero.
const ANSWERS = z.object(Object.fromEntries(QUESTION_IDS.map((id) => [id, z.string().optional()])))

const DRAFT = z.object({
  v: z.literal(1),
  accountId: z.string(),
  attemptId: z.string(),
  startedAt: z.number(),
  updatedAt: z.number(),
  answers: ANSWERS,
})

/** Uno por animal: empezar el de Luna no borra el de Tobi (spec §Edge Cases). */
export function applicationDraftKey(code: string): string {
  return `${APPLICATION_DRAFT_PREFIX}${code}`
}

function parseJson(raw: string): unknown {
  try {
    // Stryker disable BlockStatement: desde acá solo queda el bloque del catch, y vacío devuelve undefined, que el schema rechaza igual
    return JSON.parse(raw)
  } catch {
    return null
  }
}
// Stryker restore BlockStatement

// Solo para la misma cuenta y dentro de los 30 días desde la última vez que se escribió. Uno roto
// o de otra versión se descarta sin romper nada: el cuestionario arranca sin él.
export function readApplicationDraft(
  raw: string,
  accountId: string,
  now: number,
): ApplicationDraft | null {
  const draft = DRAFT.safeParse(parseJson(raw))
  if (!draft.success || draft.data.accountId !== accountId) return null
  if (now - draft.data.updatedAt >= TTL_MS) return null
  const answers: Answers = {}
  for (const id of QUESTION_IDS) {
    const value = draft.data.answers[id]
    if (value !== undefined) answers[id] = value
  }
  return { ...draft.data, answers }
}
