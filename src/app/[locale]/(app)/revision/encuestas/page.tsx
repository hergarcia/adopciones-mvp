import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { isAdmin } from '@/lib/supabase/queries/review'
import { surveySummary } from '@/lib/supabase/queries/surveys'
import { verificationExitSummary } from '@/lib/supabase/queries/verification-exits'
import { AdminBackLink } from '@/app/[locale]/(app)/_components/admin-back-link'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { shownLists, type ListQuery } from './_components/shown-lists'
import { surveyMoments } from './_components/survey-moments'
import { verificationExits } from './_components/verification-exits'

type Props = {
  params: Promise<{ locale: string }>
  /** Cuántos textos se ven de cada momento y de «Otra cosa» de cada nivel. */
  searchParams: Promise<ListQuery>
}

// Para quien no administra, ni el título de la pestaña dice que la pantalla existe (FR-040).
export async function generateMetadata(): Promise<Metadata> {
  const title = (await isAdmin())
    ? (await getTranslations('metadata.review.surveys'))('title')
    : (await getTranslations('common.not_found'))('title')
  return { title, robots: { index: false, follow: false } }
}

// Encuestas (US3): los tres momentos con sus cuentas, las barras de cada opción y lo que escribieron,
// sin el nombre de nadie (FR-042, FR-043), y debajo por qué no se verificaron (historia #234). Sin
// sesión o sin administrar, lo mismo que una ruta que no existe, sin mandar a ingresar (FR-040); la
// base lo vuelve a preguntar al leer.
export default async function SurveySummaryPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()
  if (!(await isAdmin())) notFound()

  const [query, summaries, exitRows, t] = await Promise.all([
    searchParams,
    surveySummary(),
    verificationExitSummary(),
    getTranslations('surveys.summary'),
  ])
  const shown = shownLists(query)
  const [moments, exits] = await Promise.all([
    surveyMoments(summaries, shown, locale),
    verificationExits(exitRows, shown, locale),
  ])

  return (
    <PageShell width="full">
      <AdminBackLink />
      <h1 className="afiche mb-6 text-2xl text-ink">{t('title')}</h1>
      <div className="flex flex-col gap-8">
        {moments}
        {exits}
      </div>
    </PageShell>
  )
}
