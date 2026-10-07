import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server'
import { AnswerList } from '@/components/applications/answer-list'
import { ApplicationDetailHeader } from '@/components/applications/application-detail-header'
import { ApplicationPetLayout } from '@/components/applications/application-pet-layout'
import { WithdrawApplicationDialog } from '@/components/applications/withdraw-application-dialog'
import { NotAcceptedNote } from '@/components/applications/not-accepted-note'
import { myApplicationPath, withdrawnPath } from '@/lib/applications/paths'
import { isActiveStatus } from '@/lib/applications/types'
import { requireProfile } from '@/lib/auth/require-profile'
import { LISTING_PATH } from '@/lib/pets/paths'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { getApplicationContact } from '@/lib/supabase/queries/application-responses'
import { getMyApplication } from '@/lib/supabase/queries/applications'
import {
  answerItems,
  applicationRowTexts,
  withdrawTexts,
} from '@/app/[locale]/_components/application-texts'
import { ApplicationContact } from '@/app/[locale]/_components/application-contact'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.applications.detail')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Mi solicitud (FR-072): el animal, el estado y desde cuándo, la fecha de envío, aceptada el contacto
// de quien publicó (FR-051), lo que contestó y, mientras esté activa, «Retirar» (FR-052). No aceptada,
// que no siguió y el camino a Animales en adopción, nunca el motivo (FR-021).
// La de otra persona, o una que no existe, es la misma pantalla de «no existe» (FR-070).
export default async function MyApplicationPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  await requireProfile(myApplicationPath(id))

  const application = await getMyApplication(id)
  if (application === null) notFound()

  const [t, mine, { view, texts }, items, language, contact] = await Promise.all([
    getTranslations('applications.detail'),
    getTranslations('applications.mine'),
    applicationRowTexts(application),
    answerItems(application.answers, application.petName),
    getLocale(),
    getApplicationContact(id),
  ])
  const name = application.petName

  return (
    <PageShell width="full">
      <ApplicationPetLayout
        cover={application.cover}
        photoAlt={texts.photoAlt}
        wide
        head={
          <ApplicationDetailHeader
            href={view.href}
            tone={view.tone}
            texts={{
              name,
              stamp: texts.stamp,
              // Mientras está enviada, el estado es del día del envío y la fecha se diría dos veces.
              since:
                application.status === 'sent'
                  ? null
                  : t('since', { date: momentDayLabel(application.changedAt, language) }),
              sentOn: t('sent_on', { date: momentDayLabel(application.sentAt, language) }),
              reason: texts.reason,
            }}
          />
        }
      >
        <div className="flex flex-col gap-8">
          {application.status === 'rejected' ? (
            <NotAcceptedNote
              href={LISTING_PATH}
              texts={{ body: t('rejected', { name }), toListing: mine('to_listing') }}
            />
          ) : null}
          <ApplicationContact id={application.id} contact={contact} />
          <AnswerList title={t('answers')} items={items} columns="two" />
          {isActiveStatus(application.status) ? (
            <div>
              <WithdrawApplicationDialog
                id={application.id}
                doneHref={withdrawnPath(application.id)}
                texts={await withdrawTexts(name, 'trigger')}
              />
            </div>
          ) : null}
        </div>
      </ApplicationPetLayout>
    </PageShell>
  )
}
