import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { HomeHero } from '@/components/home/home-hero'
import { HomeLayout } from '@/components/home/home-layout'
import { RescuerSteps } from '@/components/home/rescuer-steps'
import { homeViewEvent } from '@/lib/analytics/home-events'
import { trackAll } from '@/lib/analytics/track'
import { APP_NAME, INDEXING_ENABLED } from '@/lib/config'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { homeTexts } from './_components/home-texts'

type Props = {
  params: Promise<{ locale: string }>
}

// Absoluto: el sufijo del layout dejaría la portada como «Adopciones · Adopciones». La canónica se
// escribe entera: con `localePrefix: 'as-needed'` una relativa resolvería a /es, la ruta interna.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home')
  return {
    title: { absolute: APP_NAME },
    description: t('hero.title'),
    alternates: { canonical: '/' },
    robots: { index: INDEXING_ENABLED, follow: INDEXING_ENABLED },
  }
}

// La portada (historia #61): la misma para todos, con sesión o sin ella (FR-021).
export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const [texts, request] = await Promise.all([homeTexts(), headers()])
  const event = homeViewEvent({ userAgent: request.get('user-agent') })
  await trackAll(event === null ? [] : [event])

  return (
    <PageShell width="full">
      <HomeLayout
        hero={<HomeHero texts={texts.hero} />}
        rescuer={<RescuerSteps texts={texts.rescuer} />}
      />
    </PageShell>
  )
}
