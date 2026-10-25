import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import type { QuestionContentsTexts } from '@/components/questions/question-contents'
import type { QuestionFooterTexts } from '@/components/questions/question-footer'
import type { QuestionIndexGroup, QuestionIndexTexts } from '@/components/questions/question-index'
import type { QuestionSectionTexts } from '@/components/questions/question-section'
import { INDEXING_ENABLED } from '@/lib/config'
import { siteShareMetadata } from '@/lib/og/site-share-metadata'
import { formatUpdatedOn } from '@/lib/questions/dates'
import { QUESTION_FACTS } from '@/lib/questions/facts'
import { questionGroups, relatedFor } from '@/lib/questions/groups'
import {
  ACTION_PATH,
  PUBLISHED,
  type QuestionPage,
  type QuestionSection,
} from '@/lib/questions/pages'
import type { PetState } from '@/lib/pets/types'
import { LISTING_PATH } from '@/lib/pets/paths'
import { QUESTIONS_PATH, questionPath } from '@/lib/questions/paths'

type Translate = Awaited<ReturnType<typeof getTranslations<'questions'>>>
type Key = Parameters<Translate>[0]
// Las claves de una página salen del registro (`<slug>.sections.<id>.p<n>`), y TypeScript no puede
// cruzar cada slug con sus propias secciones: que cada una exista lo comprueba el test del registro
// contra messages/es.json (src/lib/questions/pages.test.ts).
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- comprobado por pages.test.ts
const key = (path: string) => path as Key
const questionTitle = (t: Translate, slug: string) => t(key(`${slug}.title`), QUESTION_FACTS)

export type QuestionPageTexts = {
  title: string
  answer: string
  card: string
  sections: QuestionSectionTexts[]
  /** Los atajos, solo si alguna sección tiene su `anchor`. */
  contents: QuestionContentsTexts | null
  footer: QuestionFooterTexts
}

type StateWords = { title: string; stamps: { state: PetState; label: string }[] }

// Las palabras de un estado son las del sello de las pantallas, en las dos formas: «Pausado o
// pausada». Disponible tiene una sola y no lleva sello, así que no muestra ninguno.
async function stateWords(state: PetState, locale: string): Promise<StateWords> {
  const [status, t] = await Promise.all([
    getTranslations('pets.status'),
    getTranslations('questions.page'),
  ])
  const male = status('stamp', { state, sex: 'male' })
  const female = status('stamp', { state, sex: 'female' })
  const labels = male === female ? [male] : [male, female]
  return {
    title:
      male === female ? male : t('state_forms', { male, female: female.toLocaleLowerCase(locale) }),
    stamps: state === 'available' ? [] : labels.map((label) => ({ state, label })),
  }
}

/** La pregunta y la tarjeta de una página, para los metadatos. */
export async function questionCardTexts(page: QuestionPage) {
  const t = await getTranslations('questions')
  return {
    title: questionTitle(t, page.slug),
    card: t(key(`${page.slug}.card`), QUESTION_FACTS),
  }
}

export async function questionPageTexts(page: QuestionPage): Promise<QuestionPageTexts> {
  const [t, locale] = await Promise.all([getTranslations('questions'), getLocale()])
  const text = (path: string) => t(key(`${page.slug}.${path}`), QUESTION_FACTS)

  const sections: readonly QuestionSection[] = page.sections
  const words = await Promise.all(
    sections.map((section) =>
      section.state === undefined ? Promise.resolve(null) : stateWords(section.state, locale),
    ),
  )
  const titleOf = (section: QuestionSection, at: number) =>
    words[at]?.title ?? text(`sections.${section.id}.title`)
  const anchored = sections.flatMap((section, at) =>
    section.anchor === undefined
      ? []
      : [{ href: `#${section.anchor}`, label: titleOf(section, at) }],
  )

  return {
    title: text('title'),
    answer: text('answer'),
    card: text('card'),
    contents: anchored.length === 0 ? null : { label: t('page.contents'), links: anchored },
    sections: sections.map((section, at) => ({
      title: titleOf(section, at),
      anchor: section.anchor,
      stamps: words[at]?.stamps,
      paragraphs: Array.from({ length: section.paragraphs }, (_, n) =>
        text(`sections.${section.id}.p${n + 1}`),
      ),
      list: section.list
        ? {
            form: section.list.form,
            items: Array.from({ length: section.list.items }, (_, n) =>
              text(`sections.${section.id}.i${n + 1}`),
            ),
          }
        : null,
      sources: (section.sources ?? []).map((source) => ({
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
          label: questionTitle(t, slug),
        })),
        toIndex: { href: QUESTIONS_PATH, label: t('page.to_index') },
      },
      action: { href: ACTION_PATH[page.action], label: t(`actions.${page.action}`) },
    },
  }
}

/** El índice: sus textos y los grupos con alguna publicada, en su orden, con la pregunta de cada una. */
export async function questionIndexTexts(): Promise<{
  texts: QuestionIndexTexts
  groups: QuestionIndexGroup[]
}> {
  const t = await getTranslations('questions')
  return {
    texts: {
      title: t('index.title'),
      lead: t('index.lead'),
      empty: t('index.empty'),
      emptyAction: { href: LISTING_PATH, label: t('index.empty_action') },
    },
    groups: questionGroups(PUBLISHED).map(({ group, slugs }) => ({
      id: group,
      title: t(`index.groups.${group}`),
      links: slugs.map((slug) => ({
        href: questionPath(slug),
        label: questionTitle(t, slug),
      })),
    })),
  }
}

/** Los metadatos del índice y de cada página: sin indexar todavía y con la tarjeta de la portada. */
export async function questionMetadata(page: {
  title: string
  card: string
  path: string
}): Promise<Metadata> {
  const home = await getTranslations('home')
  return {
    title: page.title,
    description: page.card,
    alternates: { canonical: page.path },
    robots: { index: INDEXING_ENABLED, follow: INDEXING_ENABLED },
    ...siteShareMetadata({ title: page.title, description: page.card, phrase: home('hero.title') }),
  }
}
