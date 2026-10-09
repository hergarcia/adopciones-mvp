import { questionBySlug, type QuestionSlug } from './pages'

export const QUESTIONS_PATH = '/preguntas'

export function questionPath(slug: QuestionSlug): string {
  return `${QUESTIONS_PATH}/${slug}`
}

const PREFIX = `${QUESTIONS_PATH}/`

/** La página publicada de una dirección, o null: el índice, otra ruta o un slug que no está. */
export function questionSlugOf(pathname: string): QuestionSlug | null {
  if (!pathname.startsWith(PREFIX)) return null
  return questionBySlug(pathname.slice(PREFIX.length))?.slug ?? null
}

export function isQuestionPath(pathname: string): boolean {
  return questionSlugOf(pathname) !== null
}
