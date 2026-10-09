import { getLocale, getTranslations } from 'next-intl/server'
import type { QuestionFooterTexts } from '@/components/questions/question-footer'
import type { QuestionSectionTexts } from '@/components/questions/question-section'
import { formatUpdatedOn } from '@/lib/questions/dates'
import { QUESTION_FACTS } from '@/lib/questions/facts'
import { relatedFor } from '@/lib/questions/groups'
import { ACTION_PATH, PUBLISHED, type QuestionPage } from '@/lib/questions/pages'
import { QUESTIONS_PATH, questionPath } from '@/lib/questions/paths'

type Translate = Awaited<ReturnType<typeof getTranslations<'questions'>>>
type Key = Parameters<Translate>[0]
// Las claves de una página salen del registro (`<slug>.sections.<id>.p<n>`), y TypeScript no puede
// cruzar cada slug con sus propias secciones: que cada una exista lo comprueba el test del registro
// contra messages/es.json (src/lib/questions/pages.test.ts).
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- comprobado por pages.test.ts
const key = (path: string) => path as Key

export type QuestionPageTexts = {
  title: string
  answer: string
  card: string
  sections: QuestionSectionTexts[]
  footer: QuestionFooterTexts
}

/** La pregunta y la tarjeta de una página, para los metadatos. */
export async function questionCardTexts(page: QuestionPage) {
  const t = await getTranslations('questions')
  return {
    title: t(key(`${page.slug}.title`), QUESTION_FACTS),
    card: t(key(`${page.slug}.card`), QUESTION_FACTS),
  }
}

export async function questionPageTexts(page: QuestionPage): Promise<QuestionPageTexts> {
  const [t, locale] = await Promise.all([getTranslations('questions'), getLocale()])
  const text = (path: string) => t(key(`${page.slug}.${path}`), QUESTION_FACTS)
  const titleOf = (slug: string) => t(key(`${slug}.title`), QUESTION_FACTS)

  return {
    title: text('title'),
    answer: text('answer'),
    card: text('card'),
    sections: page.sections.map((section) => ({
      title: text(`sections.${section.id}.title`),
      paragraphs: Array.from({ length: section.paragraphs }, (_, n) =>
        text(`sections.${section.id}.p${n + 1}`),
      ),
      sources: ('sources' in section ? section.sources : []).map((source) => ({
        href: source.url,
        label: t('source_prefix', { label: t(key(`sources.${source.id}`)) }),
      })),
    })),
    footer: {
      updated: {
        label: t('page.updated', { date: formatUpdatedOn(page.updatedOn, locale) }),
        day: page.updatedOn,
      },
      related: {
        title: t('page.related'),
        links: relatedFor(page, PUBLISHED).map((slug) => ({
          href: questionPath(slug),
          label: titleOf(slug),
        })),
        toIndex: { href: QUESTIONS_PATH, label: t('page.to_index') },
      },
      action: { href: ACTION_PATH[page.action], label: t(`actions.${page.action}`) },
    },
  }
}
