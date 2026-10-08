import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AnswerList } from '@/components/applications/answer-list'
import { InProcessOffer } from '@/components/applications/in-process-offer'
import { PublisherApplicationDecision } from '@/components/applications/publisher-application-decision'
import { PublisherApplicationHead } from '@/components/applications/publisher-application-head'
import { PublisherApplicationLayout } from '@/components/applications/publisher-application-layout'
import { QuestionThread } from '@/components/applications/question-thread'
import { applicationOpenedEvent } from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'
import {
  ACCEPTED_FLAG,
  ASKED_FLAG,
  INBOX_PATH,
  REJECTED_FLAG,
  REVOKED_FLAG,
  petInboxPath,
  publisherApplicationPath,
} from '@/lib/applications/paths'
import { publisherActions } from '@/lib/applications/publisher-actions'
import { requireProfile } from '@/lib/auth/require-profile'
import { openApplicationRecord } from '@/lib/supabase/queries/application-response-records'
import {
  getApplicationContact,
  getPublisherApplication,
  listApplicationQuestions,
} from '@/lib/supabase/queries/application-responses'
import { ApplicationContact } from '@/app/[locale]/_components/application-contact'
import { answerItems } from '@/app/[locale]/_components/application-texts'
import { offerTexts } from '@/app/[locale]/_components/inbox-action-texts'
import { publisherStateTexts } from '@/app/[locale]/_components/inbox-texts'
import {
  applicantHeader,
  publisherDecision,
} from '@/app/[locale]/_components/publisher-application-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'

type Props = {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{
    [ACCEPTED_FLAG]?: string
    [ASKED_FLAG]?: string
    [REJECTED_FLAG]?: string
    [REVOKED_FLAG]?: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.inbox.detail')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Una solicitud, para el publicador (FR-004): la ficha de la entrevista, con quién es y por qué
// animal, lo que contestó y la decisión (`PublisherApplicationLayout`). La ajena o inexistente no
// existe (FR-001). Abrirla la deja de marcar como nueva (FR-005). Recién aceptada (`?aceptada=1`), el
// aviso y la oferta de «En proceso»; recién rechazada, dejada sin efecto o preguntada, el aviso de lo
// que se hizo. Las preguntas, con su respuesta debajo, después de lo que contestó (FR-033). Aceptada,
// «Dejar sin efecto» ocupa el lugar de la decisión: es la salida de una aceptación que no se concretó
// (FR-024), y la decide `publisherDecision`.
export default async function PublisherApplicationPage({ params, searchParams }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const self = publisherApplicationPath(id)
  const profile = await requireProfile(self)

  const application = await getPublisherApplication(id)
  if (application === null) notFound()

  const opened = await openApplicationRecord(profile.id, id)
  if (opened?.openedFirst) {
    await trackAll([applicationOpenedEvent(new Date(opened.sentAt), new Date())])
  }

  const { pet, applicant, petName } = application
  const name = applicant?.name ?? ''
  const [t, accept, ask, reject, revoke, state, contact, questions, query] = await Promise.all([
    getTranslations('inbox.detail'),
    getTranslations('inbox.accept'),
    getTranslations('inbox.ask'),
    getTranslations('inbox.reject'),
    getTranslations('inbox.revoke'),
    publisherStateTexts(application),
    getApplicationContact(id),
    listApplicationQuestions(id),
    searchParams,
  ])
  const justAccepted = query[ACCEPTED_FLAG] === '1' && application.status === 'accepted'
  const justRejected = application.status === 'rejected'
  const done = justAccepted
    ? accept('done', { name })
    : query[ASKED_FLAG] === '1' && application.questionPending
      ? ask('done', { name })
      : justRejected && query[REVOKED_FLAG] === '1'
        ? revoke('done', { name })
        : justRejected && query[REJECTED_FLAG] === '1'
          ? reject('done', { name })
          : null

  const offer = justAccepted && pet?.state === 'available'
  const decision = await publisherDecision(publisherActions(application), name)

  return (
    <PageShell width="full">
      {done === null ? null : <ScreenToast message={done} />}
      <PublisherApplicationLayout
        head={
          <PublisherApplicationHead
            cover={application.cover}
            backHref={pet === null ? INBOX_PATH : petInboxPath(pet.id)}
            applicant={applicant === null ? null : await applicantHeader(applicant, self)}
            state={state}
            texts={{
              photoAlt: t('pet_photo_alt', { pet: petName }),
              back: pet === null ? t('back_inbox') : t('back', { pet: petName }),
              petName,
            }}
          />
        }
        contact={
          contact === null && !offer ? null : (
            <div className="flex flex-col gap-6">
              <ApplicationContact id={id} contact={contact} />
              {offer ? (
                <InProcessOffer id={id} texts={await offerTexts(petName, application.petSex)} />
              ) : null}
            </div>
          )
        }
        actions={
          decision === null ? null : <PublisherApplicationDecision id={id} decision={decision} />
        }
        body={
          <>
            {application.answers === null ? null : (
              <AnswerList
                title={t('answers')}
                items={await answerItems(application.answers, petName)}
                columns="two"
              />
            )}
            {questions.length === 0 ? null : (
              <QuestionThread
                title={t('questions')}
                items={questions}
                unanswered={t('unanswered')}
              />
            )}
          </>
        }
      />
    </PageShell>
  )
}
