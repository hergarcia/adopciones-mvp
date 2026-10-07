import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AnswerList } from '@/components/applications/answer-list'
import { ApplicantHeader } from '@/components/applications/applicant-header'
import { ContactLaterNote } from '@/components/applications/contact-later-note'
import { InProcessOffer } from '@/components/applications/in-process-offer'
import { PublisherApplicationState } from '@/components/applications/publisher-application-state'
import { ResponseActions } from '@/components/applications/response-actions'
import { TextLink } from '@/components/ui/text-link'
import { applicationOpenedEvent } from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'
import {
  ACCEPTED_FLAG,
  INBOX_PATH,
  acceptedPath,
  petInboxPath,
  publisherApplicationPath,
} from '@/lib/applications/paths'
import { publisherActions } from '@/lib/applications/publisher-actions'
import { requireProfile } from '@/lib/auth/require-profile'
import { levelsPath, publicProfilePath } from '@/lib/profile/public-paths'
import { openApplicationRecord } from '@/lib/supabase/queries/application-response-records'
import {
  getApplicationContact,
  getPublisherApplication,
} from '@/lib/supabase/queries/application-responses'
import { verifyPath } from '@/lib/verification/gate'
import { ApplicationContact } from '@/app/[locale]/_components/application-contact'
import { answerItems } from '@/app/[locale]/_components/application-texts'
import { offerTexts, responseActionTexts } from '@/app/[locale]/_components/inbox-action-texts'
import { applicantTexts, publisherStateTexts } from '@/app/[locale]/_components/inbox-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'

type Props = {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ [ACCEPTED_FLAG]?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.inbox.detail')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Una solicitud, para el publicador (FR-004): la ficha de la entrevista, con quién es arriba, lo que
// contestó y al pie la decisión. La ajena o inexistente no existe (FR-001). Abrirla la deja de
// marcar como nueva (FR-005). Recién aceptada (`?aceptada=1`), el aviso y la oferta de «En proceso».
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
  const [t, accept, state, contact, query] = await Promise.all([
    getTranslations('inbox.detail'),
    getTranslations('inbox.accept'),
    publisherStateTexts(application),
    getApplicationContact(id),
    searchParams,
  ])
  const actions = publisherActions(application)
  const justAccepted = query[ACCEPTED_FLAG] === '1' && application.status === 'accepted'

  return (
    <PageShell width="reading" className="flex flex-col gap-8">
      {justAccepted ? <ScreenToast message={accept('done', { name })} /> : null}
      <div className="flex flex-col items-start gap-4">
        <TextLink href={pet === null ? INBOX_PATH : petInboxPath(pet.id)} prefetch={false}>
          {pet === null ? t('back_inbox') : t('back', { pet: petName })}
        </TextLink>
        {applicant === null ? (
          <h1 className="afiche text-2xl break-words text-ink">{petName}</h1>
        ) : (
          <ApplicantHeader
            avatar={applicant.avatar}
            level={applicant.level}
            levelsHref={levelsPath(applicant.level, self)}
            profileHref={publicProfilePath(applicant.publicId)}
            texts={{ ...(await applicantTexts(applicant, true)), profile: t('profile') }}
          />
        )}
        <PublisherApplicationState tone={state.tone} texts={state.texts} />
      </div>

      <ApplicationContact id={id} contact={contact} />
      {justAccepted && pet?.state === 'available' ? (
        <InProcessOffer id={id} texts={await offerTexts(petName, application.petSex)} />
      ) : null}

      {application.answers === null ? null : (
        <AnswerList title={t('answers')} items={await answerItems(application.answers, petName)} />
      )}

      {actions.accept === null ? null : (
        <div className="flex flex-col gap-4">
          <ContactLaterNote text={t('contact_later')} />
          <ResponseActions
            id={id}
            accept={actions.accept}
            doneHref={acceptedPath(id)}
            gateHref={verifyPath({ reason: 'accept', next: self, from: self })}
            texts={await responseActionTexts(name)}
          />
        </div>
      )}
    </PageShell>
  )
}
