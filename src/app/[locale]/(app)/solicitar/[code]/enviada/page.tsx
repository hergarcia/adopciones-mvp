import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ApplicationSent } from '@/components/applications/application-sent'
import { activeCount } from '@/lib/applications/application-view'
import { MY_APPLICATIONS_PATH, applyPath } from '@/lib/applications/paths'
import { MAX_ACTIVE_APPLICATIONS } from '@/lib/applications/rules'
import { requireProfile } from '@/lib/auth/require-profile'
import { getMyApplication, listMyApplications } from '@/lib/supabase/queries/applications'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string; code: string }>
  searchParams: Promise<{ solicitud?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.applications.sent')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Solicitud enviada (FR-032): le llegó a quien lo publicó, cuántas de 3 tiene y los dos caminos.
// Sin una solicitud propia con ese id, a Mis solicitudes: no hay nada que confirmar.
export default async function ApplicationSentPage({ params, searchParams }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale)
  const { solicitud = '' } = await searchParams
  await requireProfile(`${applyPath(code)}/enviada?solicitud=${solicitud}`)

  const [application, all, t, form] = await Promise.all([
    getMyApplication(solicitud),
    listMyApplications(),
    getTranslations('applications.sent'),
    getTranslations('applications.form'),
  ])
  if (application === null) redirect(MY_APPLICATIONS_PATH)

  const name = application.petName
  const publisher = application.publisherName
  return (
    <PageShell width="full">
      <ApplicationSent
        cover={application.cover}
        texts={{
          photoAlt: form('photo_alt', { name }),
          stamp: t('stamp'),
          title:
            publisher === null
              ? t('title_no_publisher', { name })
              : t('title', { name, publisher }),
          count: t('count', { count: activeCount(all), max: MAX_ACTIVE_APPLICATIONS }),
          toMine: t('to_mine'),
          toListing: t('to_listing'),
        }}
      />
    </PageShell>
  )
}
