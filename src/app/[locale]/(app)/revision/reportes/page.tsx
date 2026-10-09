import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AnnounceNotices } from '@/components/forms/announce-notices'
import { WorkQueue } from '@/components/forms/work-queue'
import { OwnReportsLine } from '@/components/moderation/own-reports-line'
import { ADMIN_PATH } from '@/lib/admin/paths'
import { requireProfile } from '@/lib/auth/require-profile'
import { REPORTS_PATH } from '@/lib/moderation/paths'
import { listReportQueue } from '@/lib/supabase/queries/moderation'
import { isAdmin } from '@/lib/supabase/queries/review'
import { AdminBackLink } from '@/app/[locale]/(app)/_components/admin-back-link'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { reportEntries } from './_components/report-entries'

type Props = { params: Promise<{ locale: string }> }

// Para quien no administra, ni el título de la pestaña dice que la lista existe (FR-007).
export async function generateMetadata(): Promise<Metadata> {
  const title = (await isAdmin())
    ? (await getTranslations('metadata.reports'))('title')
    : (await getTranslations('common.not_found'))('title')
  return { title, robots: { index: false, follow: false } }
}

// La lista de reportes de quien administra (US1). Quien no administra ve lo mismo que en una ruta
// que no existe (FR-007); la base lo vuelve a preguntar al leer y al cerrar.
export default async function ReportsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  await requireProfile(REPORTS_PATH)
  if (!(await isAdmin())) notFound()

  const queue = await listReportQueue()
  const [t, toast, admin, items] = await Promise.all([
    getTranslations('moderation.reports'),
    getTranslations('common.toast'),
    getTranslations('admin'),
    reportEntries(queue.items, new Date()),
  ])

  return (
    <PageShell width="full">
      <AdminBackLink />
      <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
      <p className="mt-2 mb-6 text-sm text-ink-muted">
        {t('count', { count: queue.items.length })}
      </p>
      <OwnReportsLine
        text={queue.ownCount === 0 ? null : t('own_line', { count: queue.ownCount })}
      />
      <AnnounceNotices
        texts={{ label: toast('label'), region: toast('region'), close: toast('close') }}
      >
        <WorkQueue
          items={items}
          texts={{ label: t('list_label'), empty: t('empty'), back: admin('back') }}
          backHref={ADMIN_PATH}
        />
      </AnnounceNotices>
    </PageShell>
  )
}
