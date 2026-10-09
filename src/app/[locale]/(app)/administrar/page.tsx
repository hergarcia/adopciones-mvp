import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AdminEntries } from '@/components/admin/admin-entries'
import { AdminQueueBoard } from '@/components/admin/admin-queue-board'
import { OwnPendingList } from '@/components/admin/own-pending-list'
import { parseAdminOrigin } from '@/lib/admin/origins'
import { ADMIN_PATH } from '@/lib/admin/paths'
import { adminOpenedEvent, queueOverdueEvent } from '@/lib/analytics/admin-events'
import { trackAll } from '@/lib/analytics/track'
import { requireProfile } from '@/lib/auth/require-profile'
import { adminQueueCount, adminRecentCounts } from '@/lib/supabase/queries/admin'
import { isAdmin } from '@/lib/supabase/queries/review'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { adminHomeTexts, countedQueues } from './_components/admin-texts'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ desde?: string | string[] }>
}

// Para quien no administra, ni el título de la pestaña dice que la pantalla existe (FR-001).
export async function generateMetadata(): Promise<Metadata> {
  const title = (await isAdmin())
    ? (await getTranslations('metadata.admin.home'))('title')
    : (await getTranslations('common.not_found'))('title')
  return { title, robots: { index: false, follow: false } }
}

// Administrar (US1): las tres colas con su espera y su atraso, lo propio aparte y las entradas. Cada
// cola se cuenta aparte, así una que falla no tumba las otras (FR-016).
export default async function AdminPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  await requireProfile(ADMIN_PATH)
  if (!(await isAdmin())) notFound()

  const now = new Date()
  const [identity, pets, reports, recent] = await Promise.allSettled([
    adminQueueCount('identity'),
    adminQueueCount('pets'),
    adminQueueCount('reports'),
    adminRecentCounts(),
  ])
  const queues = countedQueues({ identity, pets, reports }, now)
  const [texts] = await Promise.all([
    adminHomeTexts(queues, recent, now),
    trackAll(
      [
        adminOpenedEvent(parseAdminOrigin((await searchParams).desde)),
        ...queues.flatMap((item) =>
          item.standing?.kind === 'overdue'
            ? [queueOverdueEvent(item.queue, item.standing.overMs)]
            : [],
        ),
      ],
      { visit: false },
    ),
  ])

  return (
    <PageShell width="full">
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <p className="mt-2 text-base text-ink-muted">{texts.lead}</p>
      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-10">
          <AdminQueueBoard label={texts.board.label} rows={texts.board.rows} />
          <OwnPendingList title={texts.own.title} items={texts.own.items} />
        </div>
        <AdminEntries label={texts.entries.label} entries={texts.entries.entries} />
      </div>
    </PageShell>
  )
}
