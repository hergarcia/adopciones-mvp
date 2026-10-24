import { getLocale, getTranslations } from 'next-intl/server'
import type { BrandMeaningTexts } from '@/components/about/brand-meaning'
import type { QuestionFooterTexts } from '@/components/questions/question-footer'
import type { QuestionSectionTexts } from '@/components/questions/question-section'
import { ABOUT_BRAND, ABOUT_FACTS, ABOUT_SECTIONS, ABOUT_UPDATED_ON } from '@/lib/about/page'
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

export type AboutTexts = {
  title: string
  lead: string
  sections: QuestionSectionTexts[]
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

  return {
    title: t('title'),
    lead: t('lead', PARAMS),
    sections: ABOUT_SECTIONS.map((section) => ({
      title: t(key(`sections.${section.id}.title`), PARAMS),
      paragraphs: lines(section.id, 'p', section.paragraphs),
      list:
        section.items > 0 ? { form: 'checks', items: lines(section.id, 'i', section.items) } : null,
      sources: [],
    })),
    brand: {
      title: t('sections.brand.title'),
      lead: t('sections.brand.lead', PARAMS),
      equation: {
        paw: {
          title: t('sections.brand.equation.paw.title'),
          note: t('sections.brand.equation.paw.note'),
        },
        print: {
          title: t('sections.brand.equation.print.title'),
          note: t('sections.brand.equation.print.note'),
        },
        mark: {
          title: t('sections.brand.equation.mark.title'),
          note: t('sections.brand.equation.mark.note'),
        },
      },
      support: t('sections.brand.support', PARAMS),
      senses: {
        intro: t('sections.brand.senses.intro'),
        senses: Array.from({ length: ABOUT_BRAND.senses }, (_, n) => ({
          title: t(key(`sections.brand.senses.s${n + 1}.title`)),
          definition: t(key(`sections.brand.senses.s${n + 1}.definition`)),
          reading: t(key(`sections.brand.senses.s${n + 1}.reading`)),
        })),
        source: t('sections.brand.senses.source'),
      },
      closing: lines(ABOUT_BRAND.id, 'p', ABOUT_BRAND.closing),
      image: t('sections.brand.image'),
      levels: t('sections.brand.levels'),
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
