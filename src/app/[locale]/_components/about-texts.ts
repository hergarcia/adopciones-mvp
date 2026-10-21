import { getLocale, getTranslations } from 'next-intl/server'
import type { QuestionFooterTexts } from '@/components/questions/question-footer'
import type { QuestionSectionTexts } from '@/components/questions/question-section'
import { ABOUT_FACTS, ABOUT_SECTIONS, ABOUT_UPDATED_ON, type AboutSection } from '@/lib/about/page'
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
  footer: QuestionFooterTexts
}

/** El título y la tarjeta, para los metadatos. */
export async function aboutCardTexts() {
  const t = await getTranslations('about')
  return { title: t('title'), card: t('card', PARAMS) }
}

export async function aboutTexts(): Promise<AboutTexts> {
  const [t, locale] = await Promise.all([getTranslations('about'), getLocale()])
  const lines = (section: AboutSection, kind: 'p' | 'i', count: number) =>
    Array.from({ length: count }, (_, n) =>
      t(key(`sections.${section.id}.${kind}${n + 1}`), PARAMS),
    )

  return {
    title: t('title'),
    lead: t('lead', PARAMS),
    sections: ABOUT_SECTIONS.map((section) => ({
      title: t(key(`sections.${section.id}.title`), PARAMS),
      paragraphs: lines(section, 'p', section.paragraphs),
      list:
        section.items > 0 ? { form: 'checks', items: lines(section, 'i', section.items) } : null,
      sources: [],
    })),
    footer: {
      updated: {
        label: t('updated', { date: formatUpdatedOn(ABOUT_UPDATED_ON, locale) }),
        day: ABOUT_UPDATED_ON,
      },
      action: { href: LISTING_PATH, label: t('action') },
    },
  }
}
