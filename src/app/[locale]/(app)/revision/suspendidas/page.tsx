import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AnnounceNotices } from '@/components/forms/announce-notices'
import { WorkQueue } from '@/components/forms/work-queue'
import { ReactivateSheet } from '@/components/moderation/reactivate-sheet'
import { SuspendedAccountRow } from '@/components/moderation/suspended-account-row'
import { personRecordPath } from '@/lib/admin/paths'
import { requireProfile } from '@/lib/auth/require-profile'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { SUSPENDED_LIST_PATH, SUSPENDED_NAME_FLAG } from '@/lib/moderation/paths'
import { listSuspendedAccounts } from '@/lib/supabase/queries/moderation'
import { isAdmin } from '@/lib/supabase/queries/review'
import { AdminBackLink } from '@/app/[locale]/(app)/_components/admin-back-link'
import { reactivateSheetTexts } from '@/app/[locale]/_components/moderation-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [SUSPENDED_NAME_FLAG]?: string }>
}

// Para quien no administra, ni el título de la pestaña dice que la lista existe (FR-025).
export async function generateMetadata(): Promise<Metadata> {
  const title = (await isAdmin())
    ? (await getTranslations('metadata.suspended_list'))('title')
    : (await getTranslations('common.not_found'))('title')
  return { title, robots: { index: false, follow: false } }
}

// Las cuentas suspendidas, de la más reciente a la más vieja, con «Reactivar» (US2). Se llega
// también recién suspendida una desde su perfil, con su nombre en la dirección para el aviso.
export default async function SuspendedAccountsPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  await requireProfile(SUSPENDED_LIST_PATH)
  if (!(await isAdmin())) notFound()

  const [accounts, query, t, suspend, toast] = await Promise.all([
    listSuspendedAccounts(),
    searchParams,
    getTranslations('moderation.suspended_list'),
    getTranslations('moderation.suspend'),
    getTranslations('common.toast'),
  ])
  const quote = await getTranslations('moderation.reports')
  const justSuspended = query[SUSPENDED_NAME_FLAG]

  const items = await Promise.all(
    accounts.map(async (account) => {
      const date = momentDayLabel(account.suspendedAt, locale)
      return {
        key: account.suspensionId,
        node: (
          <SuspendedAccountRow
            name={account.name}
            href={personRecordPath(account.publicId, 'suspended')}
            reason={quote('quote', { text: account.reason })}
            by={
              account.suspendedBy === null
                ? t('by_deleted', { date })
                : t('by', { name: account.suspendedBy, date })
            }
            action={
              <ReactivateSheet
                suspensionId={account.suspensionId}
                texts={await reactivateSheetTexts(account.name)}
              />
            }
          />
        ),
      }
    }),
  )

  return (
    <PageShell width="full">
      {justSuspended === undefined ? null : (
        <ScreenToast message={suspend('done', { name: justSuspended })} />
      )}
      <AdminBackLink />
      <h1 className="afiche mb-6 text-2xl text-ink">{t('title')}</h1>
      <AnnounceNotices
        texts={{ label: toast('label'), region: toast('region'), close: toast('close') }}
      >
        <WorkQueue items={items} texts={{ label: t('list_label'), empty: t('empty') }} />
      </AnnounceNotices>
    </PageShell>
  )
}
