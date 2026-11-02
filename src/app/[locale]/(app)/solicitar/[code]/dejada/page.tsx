import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ApplicationSent } from '@/components/applications/application-sent'
import { activeWithHeld } from '@/lib/applications/held-view'
import { MY_APPLICATIONS_PATH, heldSentPath } from '@/lib/applications/paths'
import { MAX_ACTIVE_APPLICATIONS } from '@/lib/applications/rules'
import { requireProfile } from '@/lib/auth/require-profile'
import {
  getMyHeldApplication,
  listMyApplications,
  listMyHeldApplications,
} from '@/lib/supabase/queries/applications'
import { heldLineText } from '@/app/[locale]/_components/application-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string; code: string }>
  searchParams: Promise<{ id?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.applications.held')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// La solicitud que quedó esperando la identidad (historia #289, FR-008): sale sola cuando la
// aprueben, quién no la ve hasta entonces y cuántas de 3 ocupa. Sin una propia que siga esperando
// con ese id —ya salió o no es suya—, a Mis solicitudes, que dice dónde está.
export default async function HeldSentPage({ params, searchParams }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale)
  const { id = '' } = await searchParams
  await requireProfile(heldSentPath(code, id))

  const [held, applications, allHeld, t, sent, stamps, form] = await Promise.all([
    getMyHeldApplication(id),
    listMyApplications(),
    listMyHeldApplications(),
    getTranslations('applications.held.sent'),
    getTranslations('applications.sent'),
    getTranslations('applications.mine.stamps'),
    getTranslations('applications.form'),
  ])
  if (held === null || !held.waiting) redirect(MY_APPLICATIONS_PATH)

  const name = held.petName
  return (
    <PageShell width="full">
      <ApplicationSent
        cover={held.cover}
        texts={{
          photoAlt: form('photo_alt', { name }),
          stamp: stamps('waiting_identity'),
          title: t('title', { name }),
          line: await heldLineText(held.publisherName),
          count: sent('count', {
            count: activeWithHeld(applications, allHeld),
            max: MAX_ACTIVE_APPLICATIONS,
          }),
          toMine: sent('to_mine'),
          toListing: sent('to_listing'),
        }}
      />
    </PageShell>
  )
}
