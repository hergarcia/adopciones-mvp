import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server'
import { AnswerList } from '@/components/applications/answer-list'
import { ApplicationDetailHeader } from '@/components/applications/application-detail-header'
import { WithdrawApplicationDialog } from '@/components/applications/withdraw-application-dialog'
import { myApplicationPath, withdrawnPath } from '@/lib/applications/paths'
import { requireProfile } from '@/lib/auth/require-profile'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { getMyApplication } from '@/lib/supabase/queries/applications'
import {
  answerItems,
  applicationRowTexts,
  withdrawTexts,
} from '@/app/[locale]/_components/application-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.applications.detail')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Mi solicitud (FR-072): el animal, el estado y desde cuándo, la fecha de envío, lo que contestó y,
// mientras esté activa, «Retirar» (FR-052).
// La de otra persona, o una que no existe, es la misma pantalla de «no existe» (FR-070).
export default async function MyApplicationPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  await requireProfile(myApplicationPath(id))

  const application = await getMyApplication(id)
  if (application === null) notFound()

  const [t, { view, texts }, items, language] = await Promise.all([
    getTranslations('applications.detail'),
    applicationRowTexts(application),
    answerItems(application.answers, application.petName),
    getLocale(),
  ])
  const name = application.petName

  return (
    <PageShell className="flex flex-col gap-8">
      <ApplicationDetailHeader
        cover={application.cover}
        href={view.href}
        tone={view.tone}
        texts={{
          name,
          photoAlt: texts.photoAlt,
          stamp: texts.stamp,
          since: t('since', { date: momentDayLabel(application.changedAt, language) }),
          sentOn: t('sent_on', { date: momentDayLabel(application.sentAt, language) }),
          reason: texts.reason,
        }}
      />
      <AnswerList title={t('answers')} items={items} />
      {application.status === 'sent' ? (
        <div>
          <WithdrawApplicationDialog
            id={application.id}
            doneHref={withdrawnPath(application.id)}
            texts={await withdrawTexts(name, 'trigger')}
          />
        </div>
      ) : null}
    </PageShell>
  )
}
