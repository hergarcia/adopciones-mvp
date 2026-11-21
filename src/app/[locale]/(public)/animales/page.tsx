import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { addedFromReferer, listingViewEvent } from '@/lib/analytics/listing-events'
import { trackAll } from '@/lib/analytics/track'
import { trackQuestionAction } from '@/lib/analytics/track-question-action'
import type { TrackedEvent } from '@/lib/analytics/events'
import { APP_NAME, INDEXING_ENABLED } from '@/lib/config'
import { ALERT_PARAM, withAlertParam } from '@/lib/alerts/paths'
import {
  isCanonicalListingQuery,
  listingHref,
  parseListingQuery,
  withoutQueryKey,
  type Query,
} from '@/lib/pets/listing-query'
import { LISTING_PATH } from '@/lib/pets/paths'
import { ListingFrame } from '@/app/[locale]/(public)/animales/_components/listing-frame'
import { ListingShell } from '@/app/[locale]/(public)/animales/_components/listing-shell'
import { listingTexts } from '@/app/[locale]/(public)/animales/_components/listing-texts'
import { listingView } from '@/app/[locale]/_components/listing-view'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { ListingSkeleton } from '@/components/pets/listing-skeleton'
import { InSiteArrival } from '@/app/[locale]/_components/in-site-arrival'

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
// dirección, y una dirección que no es la canónica redirige a la que sí (research R4). La marca
// `avisar` sobrevive a esa vuelta: es el aviso que pidió quien entró desde acá (#265, research R8).
async function ListingPageContent({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()
  const user = await getSessionUser()
  const { query, had: askedAlert } = withoutQueryKey(await searchParams, ALERT_PARAM)
  const { filters, shown } = parseListingQuery(query)
  if (!isCanonicalListingQuery(query)) {
    const canonical = listingHref(filters, shown)
    redirect(askedAlert ? withAlertParam(canonical) : canonical)
  }

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
    <ListingFrame title={t('title')}>
      <ListingShell
        key={listingHref(filters, shown)}
        filters={filters}
        failed={first === null}
        signedIn={user !== null}
        autoCreate={askedAlert}
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
    </ListingFrame>
  )
}

// Abierto desde afuera llega entero; desde la portada, la cabecera o cualquier enlace del sitio,
// primero su espera, con el título de siempre (historia #302). Volver atrás lo repone el router sin
// pedirlo, así que no pasa por acá.
export default async function ListingPage(props: Props) {
  const t = await getTranslations('pets.listing')
  return (
    <InSiteArrival
      fallback={
        <ListingFrame title={t('title')}>
          <ListingSkeleton />
        </ListingFrame>
      }
    >
      <ListingPageContent {...props} />
    </InSiteArrival>
  )
}
