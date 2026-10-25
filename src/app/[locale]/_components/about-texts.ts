import { getLocale, getTranslations } from 'next-intl/server'
import type { BrandMeaningTexts } from '@/components/about/brand-meaning'
import type { QuestionFooterTexts } from '@/components/questions/question-footer'
import type { QuestionSectionTexts } from '@/components/questions/question-section'
import { ABOUT_FACTS, ABOUT_SECTIONS, ABOUT_UPDATED_ON } from '@/lib/about/page'
import { APP_NAME } from '@/lib/config'
import { LISTING_PATH } from '@/lib/pets/paths'
import { formatUpdatedOn } from '@/lib/questions/dates'

type Translate = Awaited<ReturnType<typeof getTranslations<'about'>>>
type Key = Parameters<Translate>[0]
// Las claves de cada parte salen de la estructura (`sections.<id>.p<n>`), y TypeScript no las
// puede cruzar con las de messages/es.json: que existan todas, y ninguna más, lo comprueba
// src/lib/about/page.test.ts.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- comprobado por page.test.ts
const key = (path: string) => path as Key

const PARAMS = { app: APP_NAME, ...ABOUT_FACTS }

export type AboutSectionTexts = {
  texts: QuestionSectionTexts
  /** El enlace a los niveles al pie de la parte, en la que nombra la chapita. */
  levels: string | null
}

export type AboutTexts = {
  title: string
  lead: string
  sections: AboutSectionTexts[]
  brand: BrandMeaningTexts
  footer: QuestionFooterTexts
}

/** El título y la tarjeta, para los metadatos. */
export async function aboutCardTexts() {
  const t = await getTranslations('about')
  return { title: t('title'), card: t('card', PARAMS) }
}

export async function aboutTexts(): Promise<AboutTexts> {
  const [t, locale] = await Promise.all([getTranslations('about'), getLocale()])
  const lines = (id: string, kind: 'p' | 'i', count: number) =>
    Array.from({ length: count }, (_, n) => t(key(`sections.${id}.${kind}${n + 1}`), PARAMS))

  const term = (id: 'paw' | 'print' | 'mark') => ({
    title: t(key(`sections.brand.equation.${id}.title`)),
    note: t(key(`sections.brand.equation.${id}.note`)),
  })

  return {
    title: t('title'),
    lead: t('lead', PARAMS),
    sections: ABOUT_SECTIONS.map((section) => ({
      texts: {
        title: t(key(`sections.${section.id}.title`), PARAMS),
        paragraphs: lines(section.id, 'p', section.paragraphs),
        list:
          section.items > 0
            ? { form: 'checks', items: lines(section.id, 'i', section.items) }
            : null,
        sources: [],
      },
      levels: section.levels ? t(key(`sections.${section.id}.levels`)) : null,
    })),
    brand: {
      title: t('sections.brand.title'),
      lead: t('sections.brand.lead', PARAMS),
      equation: { paw: term('paw'), print: term('print'), mark: term('mark') },
      image: t('sections.brand.image'),
    },
    footer: {
      updated: {
        label: t('updated', { date: formatUpdatedOn(ABOUT_UPDATED_ON, locale) }),
        day: ABOUT_UPDATED_ON,
      },
      action: { href: LISTING_PATH, label: t('action') },
    },
  }
}
