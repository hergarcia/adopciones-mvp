import type { OwnAnswerWords } from './answer-words'
import type { PetApplicationRow } from './types'

/** La respuesta propia en un renglón de la carpeta, con la pregunta solo si no es la de hoy. */
export type FolderOwnAnswer = { question: string | null; answer: string }

/**
 * Lo que un renglón de «Solicitudes por Luna» muestra de la pregunta propia (historia #298): nada en
 * una aceptada o cerrada, donde ya se eligió. La pregunta de hoy va una vez arriba de la carpeta; al
 * lado de la respuesta va solo la que contestó cuando es otra, porque leerla debajo de una pregunta
 * que la persona nunca vio engaña a quien decide (#292).
 */
export function folderOwnAnswer(
  row: Pick<PetApplicationRow, 'status'> & { own: OwnAnswerWords | null },
  current: string | null,
): FolderOwnAnswer | null {
  if (row.status !== 'sent' || row.own === null) return null
  return {
    question: row.own.question === current ? null : row.own.question,
    answer: row.own.answer,
  }
}

/** La pregunta de hoy arriba de la carpeta: solo si la tiene y alguien la solicitó. */
export function folderQuestion(current: string | null, applications: number): string | null {
  return applications > 0 ? current : null
}
