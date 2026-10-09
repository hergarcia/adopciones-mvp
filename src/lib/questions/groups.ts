import {
  GROUP_ORDER,
  QUESTION_PAGES,
  type QuestionGroup,
  type QuestionPage,
  type QuestionSlug,
} from './pages'

export type QuestionGroupView = { group: QuestionGroup; slugs: QuestionSlug[] }

/** Los grupos del índice en su orden, cada uno con sus publicadas; sin los que quedan vacíos. */
export function questionGroups(published: readonly QuestionSlug[]): QuestionGroupView[] {
  return GROUP_ORDER.map((group) => ({
    group,
    slugs: QUESTION_PAGES.filter(
      (page) => page.group === group && published.includes(page.slug),
    ).map((page) => page.slug),
  })).filter((view) => view.slugs.length > 0)
}

// El registro nunca pone la propia; vacía, la página muestra el enlace al índice.
export function relatedFor(
  page: Pick<QuestionPage, 'related'>,
  published: readonly QuestionSlug[],
): QuestionSlug[] {
  return page.related.filter((other) => published.includes(other))
}
