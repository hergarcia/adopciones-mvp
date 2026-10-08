import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server'
import { AdoptionPanel } from '@/components/adoptions/adoption-panel'
import { AnswerList } from '@/components/applications/answer-list'
import { AnswerQuestionForm } from '@/components/applications/answer-question-form'
import { ApplicationDetailHeader } from '@/components/applications/application-detail-header'
import { ApplicationPetLayout } from '@/components/applications/application-pet-layout'
import { WithdrawApplicationDialog } from '@/components/applications/withdraw-application-dialog'
import { NotAcceptedNote } from '@/components/applications/not-accepted-note'
import { QuestionThread } from '@/components/applications/question-thread'
import { adoptionView, shownContact } from '@/lib/adoptions/adoption-view'
import { answeredPath, myApplicationPath, withdrawnPath } from '@/lib/applications/paths'
import { isActiveStatus } from '@/lib/applications/types'
import { followUpView } from '@/lib/follow-ups/follow-up-view'
import { requireProfile } from '@/lib/auth/require-profile'
import { LISTING_PATH } from '@/lib/pets/paths'
import { momentDayLabel } from '@/lib/moderation/day-label'
import {
  getApplicationContact,
  listApplicationQuestions,
} from '@/lib/supabase/queries/application-responses'
import { getAdoptionOf } from '@/lib/supabase/queries/adoptions'
import { getMyApplication } from '@/lib/supabase/queries/applications'
import {
  answerItems,
  answerQuestionTexts,
  applicationRowTexts,
  withdrawTexts,
} from '@/app/[locale]/_components/application-texts'
import { ApplicationContact } from '@/app/[locale]/_components/application-contact'
import { followUpWithPhotos } from '@/app/[locale]/_components/follow-up-texts'
import { MyFollowUp } from '@/app/[locale]/_components/my-follow-up'
import { adoptionPanelTexts } from '@/app/[locale]/_components/handover-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { MyApplicationNotice, type MyApplicationFlags } from './_components/my-application-notice'

type Props = {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<MyApplicationFlags>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.applications.detail')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Mi solicitud (FR-072): el animal, el estado y desde cuándo, la fecha de envío, aceptada el contacto
// de quien publicó (FR-051), lo que contestó y, mientras esté activa, «Retirar» (FR-052). No aceptada,
// que no siguió y el camino a Animales en adopción, nunca el motivo (FR-021). Las preguntas del
// publicador van primero, con la que falta para contestar mientras siga activa (FR-051); sin
// preguntas, esa parte no está (US3-AS7).
// La elegida al marcar adoptado, su adopción y el contacto según ella (historia #67, FR-030); después
// de «Yo no adopté», cerrada como que encontró hogar, sin compromiso ni contacto (FR-021).
// Con el seguimiento pedido, contar cómo va primero, arriba de la adopción; mandado, la respuesta con el sello y
// ya sin «Yo no adopté» (historia #69, FR-017).
// La de otra persona, o una que no existe, es la misma pantalla de «no existe» (FR-070).
export default async function MyApplicationPage({ params, searchParams }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  await requireProfile(myApplicationPath(id))

  const application = await getMyApplication(id)
  if (application === null) notFound()

  const [t, mine, { view, texts }, items, language, contact, questions, query] = await Promise.all([
    getTranslations('applications.detail'),
    getTranslations('applications.mine'),
    applicationRowTexts(application),
    answerItems(application.answers, application.petName),
    getLocale(),
    getApplicationContact(id),
    listApplicationQuestions(id),
    searchParams,
  ])
  const name = application.petName
  const active = isActiveStatus(application.status)
  const pending = active ? questions.find((question) => question.answer === null) : undefined
  const [adoption, followUp] =
    application.closeReason === 'handed_over'
      ? await Promise.all([getAdoptionOf(id), followUpWithPhotos(id)])
      : [null, { row: null, photos: [] }]
  const adoptionState = adoption === null ? null : adoptionView(adoption)
  const followUpState = followUpView(followUp.row, 'adopter')
  const publisher = application.publisherName ?? ''
  // El correo del día 30 trae a contar cómo va: mientras está pedido, el pedido va primero y el
  // compromiso ya aceptado queda debajo; contestado, la respuesta vuelve debajo de la adopción.
  const isFollowUpOpen = followUpState.kind === 'form'
  const myFollowUp = (
    <MyFollowUp
      applicationId={application.id}
      view={followUpState}
      photos={followUp.photos}
      names={{ pet: name, publisher, adopter: adoption?.adopterName ?? '' }}
    />
  )

  return (
    <PageShell width="full">
      <MyApplicationNotice
        flags={query}
        state={{
          hasPendingQuestion: pending !== undefined,
          isCommitmentAccepted: adoption !== null && adoption.adopterAcceptedAt !== null,
          followUpKind: followUpState.kind,
          isClosedAsAdopted: application.closeReason === 'adopted',
        }}
        names={{ pet: name, publisher }}
      />
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
          {isFollowUpOpen ? myFollowUp : null}
          {adoption === null || adoptionState === null ? null : (
            <AdoptionPanel
              applicationId={application.id}
              view={adoptionState}
              texts={await adoptionPanelTexts(adoption)}
            />
          )}
          {isFollowUpOpen ? null : myFollowUp}
          <ApplicationContact
            id={application.id}
            contact={shownContact(adoptionState, contact)}
            // Una sola tirita por pantalla: aceptar el compromiso o contar cómo va le ganan a WhatsApp.
            action={adoptionState?.canAccept === true || isFollowUpOpen ? 'secondary' : 'tirita'}
          />
          {questions.length === 0 ? null : (
            <QuestionThread
              title={t('questions')}
              items={questions}
              unanswered={t('unanswered')}
              pending={
                pending === undefined ? undefined : (
                  <AnswerQuestionForm
                    questionId={pending.id}
                    doneHref={answeredPath(application.id)}
                    texts={await answerQuestionTexts()}
                  />
                )
              }
            />
          )}
          <AnswerList title={t('answers')} items={items} columns="two" />
          {active ? (
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
