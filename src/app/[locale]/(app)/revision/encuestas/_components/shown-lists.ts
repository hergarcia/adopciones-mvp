import { SURVEY_SUMMARY_PATH } from '@/lib/feedback/paths'
import { LIST_STEP, shownCount } from '@/lib/lists/newest-first'
import type { SurveyMoment } from '@/lib/surveys/types'
import type { ExitLevel } from '@/lib/verification/exit-question'

/** El nombre en la dirección de los textos de «Otra cosa» de cada nivel (research R8). */
export const EXIT_LIST_KEY = {
  phone: 'salida_phone',
  identity: 'salida_identity',
} as const satisfies Record<ExitLevel, string>

export type ListKey = SurveyMoment | (typeof EXIT_LIST_KEY)[ExitLevel]

/** Cuántos textos se ven de cada lista de Encuestas: las respuestas libres y los de «Otra cosa». */
export type ShownLists = Record<ListKey, number>

export type ListQuery = Partial<Record<ListKey, string | string[]>>

export function shownLists(query: ListQuery): ShownLists {
  return {
    gave: shownCount(query.gave),
    adopted: shownCount(query.adopted),
    not_chosen: shownCount(query.not_chosen),
    salida_phone: shownCount(query.salida_phone),
    salida_identity: shownCount(query.salida_identity),
  }
}

// «Ver más» de una lista: un tramo más de esa, las demás como estaban, y el ancla del último texto
// que se veía.
export function moreHref(shown: ShownLists, key: ListKey, lastId: string): string {
  const query = new URLSearchParams(
    Object.entries({ ...shown, [key]: shown[key] + LIST_STEP }).map(([name, value]) => [
      name,
      String(value),
    ]),
  )
  return `${SURVEY_SUMMARY_PATH}?${query.toString()}#${lastId}`
}
