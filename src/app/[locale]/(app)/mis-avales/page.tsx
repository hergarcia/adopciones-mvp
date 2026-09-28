import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { listMyVouches } from '@/lib/supabase/queries/vouches'
import { MY_VOUCHES_PATH, VOUCH_FLAG } from '@/lib/vouches/paths'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { viewerLevel } from '@/app/[locale]/_components/viewer-level'
import { VouchNotice } from '@/app/[locale]/_components/vouch-notice'
import { MyVouchesSections } from './_components/my-vouches-sections'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ aval?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.my_vouches')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function MyVouchesPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const profile = await requireProfile(MY_VOUCHES_PATH)
  const user = await getSessionUser()
  if (user === null) notFound()

  const [rows, level, query] = await Promise.all([
    listMyVouches(user.id),
    viewerLevel(),
    searchParams,
  ])
  const t = await getTranslations('vouches.mine')

  return (
    <PageShell width="full">
      <VouchNotice flag={query[VOUCH_FLAG]} signedIn />
      <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
      <MyVouchesSections
        rows={rows}
        me={{ publicId: profile.publicId, levelTwo: level.levelTwo, step: level.step }}
      />
    </PageShell>
  )
}
