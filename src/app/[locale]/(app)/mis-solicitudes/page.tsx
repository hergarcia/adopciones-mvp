import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ApplicationList } from '@/components/applications/application-list'
import { ApplicationRow } from '@/components/applications/application-row'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { activeCount } from '@/lib/applications/application-view'
import { MY_APPLICATIONS_PATH, myApplicationPath } from '@/lib/applications/paths'
import { MAX_ACTIVE_APPLICATIONS } from '@/lib/applications/rules'
import type { ApplicationSummary } from '@/lib/applications/types'
import { requireProfile } from '@/lib/auth/require-profile'
import { LISTING_PATH } from '@/lib/pets/paths'
import { listMyApplications } from '@/lib/supabase/queries/applications'
import { applicationRowTexts } from '@/app/[locale]/_components/application-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.applications.mine')
  return { title: t('title'), robots: { index: false, follow: false } }
}

async function rowsOf(applications: ApplicationSummary[]) {
  return Promise.all(
    applications.map(async (application) => {
      const { view, texts } = await applicationRowTexts(application)
      return (
        <ApplicationRow
          key={application.id}
          href={myApplicationPath(application.id)}
          cover={application.cover}
          tone={view.tone}
          texts={texts}
        />
      )
    }),
  )
}

// Mis solicitudes (FR-071): cuántas de 3 activas, las activas primero y después las cerradas y
// retiradas, cada grupo de la más reciente a la más vieja (el orden lo da la base).
export default async function MyApplicationsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireProfile(MY_APPLICATIONS_PATH)

  const [applications, t] = await Promise.all([
    listMyApplications(),
    getTranslations('applications.mine'),
  ])

  if (applications.length === 0) {
    return (
      <PageShell width="full">
        <HeadedEmptyState
          title={t('title')}
          body={t('empty')}
          action={
            <LinkButton href={LISTING_PATH} variant="secondary">
              {t('to_listing')}
            </LinkButton>
          }
        />
      </PageShell>
    )
  }

  const active = applications.filter((application) => application.status === 'sent')
  const past = applications.filter((application) => application.status !== 'sent')
  const [activeRows, pastRows] = await Promise.all([rowsOf(active), rowsOf(past)])

  return (
    <PageShell className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
        <p className="text-sm text-ink-muted tabular-nums">
          {t('count', { count: activeCount(applications), max: MAX_ACTIVE_APPLICATIONS })}
        </p>
      </header>
      {activeRows.length === 0 ? null : (
        <ApplicationList title={t('active')} label={t('list_label', { group: t('active') })}>
          {activeRows}
        </ApplicationList>
      )}
      {pastRows.length === 0 ? null : (
        <ApplicationList title={t('past')} label={t('list_label', { group: t('past') })}>
          {pastRows}
        </ApplicationList>
      )}
    </PageShell>
  )
}
