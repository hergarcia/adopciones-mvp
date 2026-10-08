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
import { COMMITTED_FLAG, DECLINED_FLAG } from '@/lib/adoptions/paths'
import {
  ANSWERED_FLAG,
  answeredPath,
  myApplicationPath,
  withdrawnPath,
} from '@/lib/applications/paths'
import { isActiveStatus } from '@/lib/applications/types'
import { followUpView } from '@/lib/follow-ups/follow-up-view'
import { FOLLOW_UP_SENT_FLAG } from '@/lib/follow-ups/paths'
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
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'

type Props = {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{
    [ANSWERED_FLAG]?: string
    [COMMITTED_FLAG]?: string
    [DECLINED_FLAG]?: string
    [FOLLOW_UP_SENT_FLAG]?: string
  }>
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
// Con el seguimiento pedido, contar cómo va debajo de la adopción; mandado, la respuesta con el sello y
// ya sin «Yo no adopté» (historia #69, FR-017).
// La de otra persona, o una que no existe, es la misma pantalla de «no existe» (FR-070).
export default async function MyApplicationPage({ params, searchParams }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  await requireProfile(myApplicationPath(id))

  const application = await getMyApplication(id)
  if (application === null) notFound()

  const [t, mine, answer, { view, texts }, items, language, contact, questions, query] =
    await Promise.all([
      getTranslations('applications.detail'),
      getTranslations('applications.mine'),
      getTranslations('applications.answer'),
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

  return (
    <PageShell width="full">
      {query[ANSWERED_FLAG] === '1' && pending === undefined ? (
        <ScreenToast message={answer('done')} />
      ) : null}
      {query[COMMITTED_FLAG] === '1' && adoption !== null && adoption.adopterAcceptedAt !== null ? (
        <ScreenToast message={(await getTranslations('adoptions.commitment'))('accepted_done')} />
      ) : null}
      {query[FOLLOW_UP_SENT_FLAG] === '1' && followUpState.kind === 'answer' ? (
        <ScreenToast
          message={(await getTranslations('follow_ups.toast'))('sent', { name, publisher })}
        />
      ) : null}
      {query[DECLINED_FLAG] === '1' && application.closeReason === 'adopted' ? (
        <ScreenToast
          message={(await getTranslations('adoptions.decline'))('done', {
            name,
            publisher,
          })}
        />
      ) : null}
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
          {adoption === null || adoptionState === null ? null : (
            <AdoptionPanel
              applicationId={application.id}
              view={adoptionState}
              texts={await adoptionPanelTexts(adoption)}
            />
          )}
          <MyFollowUp
            applicationId={application.id}
            view={followUpState}
            photos={followUp.photos}
            names={{ pet: name, publisher, adopter: adoption?.adopterName ?? '' }}
          />
          <ApplicationContact
            id={application.id}
            contact={shownContact(adoptionState, contact)}
            action={adoptionState?.canAccept === true ? 'secondary' : 'tirita'}
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
