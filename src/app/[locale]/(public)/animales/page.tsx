import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { addedFromReferer, listingViewEvent } from '@/lib/analytics/listing-events'
import { trackAll } from '@/lib/analytics/track'
import { trackQuestionAction } from '@/lib/analytics/track-question-action'
import type { TrackedEvent } from '@/lib/analytics/events'
import { APP_NAME, INDEXING_ENABLED } from '@/lib/config'
import {
  isCanonicalListingQuery,
  listingHref,
  parseListingQuery,
  type Query,
} from '@/lib/pets/listing-query'
import { LISTING_PATH } from '@/lib/pets/paths'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { ListingShell } from './_components/listing-shell'
import { listingTexts } from './_components/listing-texts'
import { listingView } from '@/app/[locale]/_components/listing-view'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Query>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pets.metadata.listing')
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: LISTING_PATH },
    robots: { index: INDEXING_ENABLED, follow: INDEXING_ENABLED },
    // La vista previa del listado, con o sin filtros, es solo el sitio (FR-012).
    openGraph: { type: 'website', siteName: APP_NAME, title: APP_NAME, description: t('title') },
  }
}

// «Animales en adopción» (historia #57): la primera vista sale del servidor con los filtros de la
// dirección, y una dirección que no es la canónica redirige a la que sí (research R4).
export default async function ListingPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()
  const query = await searchParams
  const { filters, shown } = parseListingQuery(query)
  if (!isCanonicalListingQuery(query)) redirect(listingHref(filters, shown))

  const [t, texts, request, first] = await Promise.all([
    getTranslations('pets.listing'),
    listingTexts(),
    headers(),
    listingView(filters, null, shown).catch(() => null),
  ])
  const referer = request.get('referer')
  const host = request.get('host')
  const view = listingViewEvent({ userAgent: request.get('user-agent'), referer, host })
  const filterEvents: TrackedEvent[] =
    view === null
      ? []
      : addedFromReferer(referer, host, filters).map((props) => ({
          name: 'listing_filter_used',
          props,
        }))
  await Promise.all([
    trackAll(view === null ? [] : [view, ...filterEvents]),
    trackQuestionAction(LISTING_PATH),
  ])

  return (
    <PageShell width="full">
      <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
      <div className="mt-2">
        <ListingShell
          key={listingHref(filters, shown)}
          filters={filters}
          failed={first === null}
          view={
            first ?? {
              cards: [],
              next: null,
              total: 0,
              totalText: '',
              signedAt: new Date().toISOString(),
            }
          }
          texts={texts}
        />
      </div>
    </PageShell>
  )
}
