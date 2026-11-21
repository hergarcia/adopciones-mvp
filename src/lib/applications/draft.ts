import * as z from 'zod/mini'
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
  /**
   * La pregunta propia que estaba en pantalla y lo escrito para ella (historia #292). Opcional: un
   * borrador de antes sigue sirviendo.
   */
  own?: { question: string; answer: string }
}

const TTL_MS = DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000

// Lo que no es una pregunta se descarta; una respuesta que no es texto rompe el borrador entero.
const ANSWERS = z.object(Object.fromEntries(QUESTION_IDS.map((id) => [id, z.optional(z.string())])))

const DRAFT = z.object({
  v: z.literal(1),
  accountId: z.string(),
  attemptId: z.string(),
  startedAt: z.number(),
  updatedAt: z.number(),
  answers: ANSWERS,
  own: z.optional(z.object({ question: z.string(), answer: z.string() })),
})

// Sin zod, en su propio archivo: el cuestionario la usa al abrir (historia #304).
export { applicationDraftKey } from './draft-key'

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
