import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AdopterPromise } from '@/components/home/adopter-promise'
import { HomeHero } from '@/components/home/home-hero'
import { HomeLayout } from '@/components/home/home-layout'
import { RecentPets } from '@/components/home/recent-pets'
import { RescuerSteps } from '@/components/home/rescuer-steps'
import { homeViewEvent } from '@/lib/analytics/home-events'
import { trackAll } from '@/lib/analytics/track'
import { APP_NAME, INDEXING_ENABLED } from '@/lib/config'
import { SHARE_IMAGE_SIZE } from '@/lib/og/share-image'
import { siteShareVersion } from '@/lib/og/site-share-version'
import { NO_FILTERS } from '@/lib/pets/listing-query'
import { listingView } from '@/app/[locale]/_components/listing-view'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { StaleImagesRefresh } from '@/app/[locale]/_components/stale-images-refresh'
import { homeTexts } from './_components/home-texts'

type Props = {
  params: Promise<{ locale: string }>
}

// Absoluto: el sufijo del layout dejaría la portada como «Adopciones · Adopciones». La canónica se
// escribe entera: con `localePrefix: 'as-needed'` una relativa resolvería a /es, la ruta interna.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home')
  const phrase = t('hero.title')
  const image = {
    url: `/imagen?v=${siteShareVersion({ siteName: APP_NAME, phrase })}`,
    ...SHARE_IMAGE_SIZE,
  }
  return {
    title: { absolute: APP_NAME },
    description: phrase,
    alternates: { canonical: '/' },
    robots: { index: INDEXING_ENABLED, follow: INDEXING_ENABLED },
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      title: APP_NAME,
      description: phrase,
      images: [{ ...image, type: 'image/jpeg', alt: phrase }],
    },
    twitter: {
      card: 'summary_large_image',
      title: APP_NAME,
      description: phrase,
      images: [image.url],
    },
  }
}

// Los primeros del listado, con sus mismas reglas de quién se ve (research R1).
const RECENT_SHOWN = 8

// La portada (historia #61): la misma para todos, con sesión o sin ella (FR-021). Sin `Suspense`:
// llega entera del servidor para leerse sin JavaScript, y si los animales fallan solo su bloque lo
// dice (research R2, R3).
export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const [texts, request, recent] = await Promise.all([
    homeTexts(),
    headers(),
    listingView(NO_FILTERS, null, RECENT_SHOWN).catch(() => null),
  ])
  const event = homeViewEvent({ userAgent: request.get('user-agent') })
  await trackAll(event === null ? [] : [event])

  return (
    <PageShell width="full">
      <HomeLayout
        hero={<HomeHero texts={texts.hero} />}
        rescuer={<RescuerSteps texts={texts.rescuer} />}
        adopter={<AdopterPromise texts={texts.adopter} />}
        recent={<RecentPets cards={recent?.cards ?? null} texts={texts.recent} />}
      />
      {recent === null ? null : <StaleImagesRefresh signedAt={recent.signedAt} />}
    </PageShell>
  )
}
