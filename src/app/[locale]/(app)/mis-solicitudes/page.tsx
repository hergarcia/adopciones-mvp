import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ApplicationList } from '@/components/applications/application-list'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { isOngoingAdoption } from '@/lib/applications/application-view'
import { activeWithHeld, newestFirst } from '@/lib/applications/held-view'
import { MY_APPLICATIONS_PATH, WITHDRAWN_FLAG } from '@/lib/applications/paths'
import { MAX_ACTIVE_APPLICATIONS } from '@/lib/applications/rules'
import { isActiveStatus } from '@/lib/applications/types'
import { requireProfile } from '@/lib/auth/require-profile'
import { LISTING_PATH } from '@/lib/pets/paths'
import { listMyApplications, listMyHeldApplications } from '@/lib/supabase/queries/applications'
import { myOpenFollowUps } from '@/lib/supabase/queries/follow-ups'
import { myApplicationRows } from '@/app/[locale]/(app)/_components/my-application-rows'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [WITHDRAWN_FLAG]?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.applications.mine')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Mis solicitudes (FR-071): cuántas de 3 activas, las activas primero, después las adopciones en
// curso —con el compromiso que quizá falta aceptar, no entre las retiradas (historia #67)— y al final
// las cerradas y retiradas, cada grupo de la más reciente a la más vieja. Las que se dejaron escritas
// esperando la identidad van entre las activas y, las que no salieron, entre las cerradas (#289).
export default async function MyApplicationsPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireProfile(MY_APPLICATIONS_PATH)

  const [applications, held, openFollowUps, t, withdraw, query] = await Promise.all([
    listMyApplications(),
    listMyHeldApplications(),
    myOpenFollowUps(),
    getTranslations('applications.mine'),
    getTranslations('applications.withdraw'),
    searchParams,
  ])
  // La confirmación dice por quién la retiró; un id que no es una retirada suya no dice nada.
  const withdrawn = applications.find(
    (application) => application.id === query[WITHDRAWN_FLAG] && application.status === 'withdrawn',
  )
  const notice =
    withdrawn === undefined ? null : (
      <ScreenToast message={withdraw('done', { name: withdrawn.petName })} />
    )

  if (applications.length === 0 && held.length === 0) {
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

  const active = applications.filter((application) => isActiveStatus(application.status))
  const adopted = applications.filter(isOngoingAdoption)
  const past = applications.filter(
    (application) => !isActiveStatus(application.status) && !isOngoingAdoption(application),
  )
  const [activeRows, adoptedRows, pastRows] = await Promise.all([
    myApplicationRows(
      newestFirst(
        active,
        held.filter((one) => one.status === 'waiting'),
      ),
      openFollowUps,
    ),
    myApplicationRows(newestFirst(adopted, []), openFollowUps),
    myApplicationRows(
      newestFirst(
        past,
        held.filter((one) => one.status === 'lapsed'),
      ),
      openFollowUps,
    ),
  ])

  return (
    <PageShell width="full" className="flex flex-col gap-10">
      {notice}
      <header className="flex flex-col gap-2">
        <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
        <p className="text-sm text-ink-muted tabular-nums">
          {t('count', { count: activeWithHeld(applications, held), max: MAX_ACTIVE_APPLICATIONS })}
        </p>
      </header>
      {activeRows.length === 0 ? null : (
        <ApplicationList
          title={t('active')}
          label={t('list_label', { group: t('active') })}
          columns="three"
        >
          {activeRows}
        </ApplicationList>
      )}
      {adoptedRows.length === 0 ? null : (
        <ApplicationList
          title={t('adoptions')}
          label={t('list_label', { group: t('adoptions') })}
          columns="three"
        >
          {adoptedRows}
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
