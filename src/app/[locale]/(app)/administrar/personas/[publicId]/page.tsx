import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PersonRecordHeader } from '@/components/admin/person-record-header'
import { RecordSection } from '@/components/admin/record-section'
import { AnnounceNotices } from '@/components/forms/announce-notices'
import { RecordModeration } from '@/components/moderation/record-moderation'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { parseRecordOrigin } from '@/lib/admin/origins'
import { ADMIN_PATH, personRecordPath, RECORD_PARTS, RECORD_STEP } from '@/lib/admin/paths'
import { recordOpenedEvent } from '@/lib/analytics/admin-events'
import { trackAll } from '@/lib/analytics/track'
import { requireProfile } from '@/lib/auth/require-profile'
import { shownCount } from '@/lib/lists/newest-first'
import { personRecord } from '@/lib/supabase/queries/admin'
import { signAvatarUrl } from '@/lib/supabase/queries/avatars'
import { isAdmin } from '@/lib/supabase/queries/review'
import { AdminBackLink } from '@/app/[locale]/(app)/_components/admin-back-link'
import {
  reactivateSheetTexts,
  suspendSheetTexts,
} from '@/app/[locale]/_components/moderation-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { goneTexts, personRecordTexts } from './_components/record-texts'

type Query = { [key: string]: string | string[] | undefined }

type Props = {
  params: Promise<{ locale: string; publicId: string }>
  searchParams: Promise<Query>
}

// Para quien no administra, ni el título de la pestaña dice que la pantalla existe (FR-001). El
// título no lleva el nombre de la persona.
export async function generateMetadata(): Promise<Metadata> {
  const title = (await isAdmin())
    ? (await getTranslations('metadata.admin.record'))('title')
    : (await getTranslations('common.not_found'))('title')
  return { title, robots: { index: false, follow: false } }
}

// La ficha de una persona (US2): quién es y sus antecedentes de identidad, reportes, suspensiones y
// publicaciones, con suspender o reactivar salvo en la propia.
export default async function PersonRecordPage({ params, searchParams }: Props) {
  const { locale, publicId } = await params
  setRequestLocale(locale)

  await requireProfile(personRecordPath(publicId))
  if (!(await isAdmin())) notFound()

  const [record, query] = await Promise.all([personRecord(publicId), searchParams])
  if (record === null) {
    const gone = await goneTexts()
    return (
      <PageShell>
        <HeadedEmptyState
          title={gone.title}
          body={gone.body}
          action={
            <LinkButton href={ADMIN_PATH} variant="secondary">
              {gone.back}
            </LinkButton>
          }
        />
      </PageShell>
    )
  }

  const { person } = record
  const shown = {
    identity: shownCount(query[RECORD_PARTS.identity], RECORD_STEP),
    reports: shownCount(query[RECORD_PARTS.reports], RECORD_STEP),
    suspensions: shownCount(query[RECORD_PARTS.suspensions], RECORD_STEP),
    pets: shownCount(query[RECORD_PARTS.pets], RECORD_STEP),
  }
  const [texts, avatar, toast, moderation] = await Promise.all([
    personRecordTexts(record, shown, new Date(), locale),
    person.avatarPath === null ? null : signAvatarUrl(person.avatarPath),
    getTranslations('common.toast'),
    person.isSelf ? null : moderationTexts(person.name),
    trackAll([recordOpenedEvent(parseRecordOrigin(query.desde))], { visit: false }),
  ])

  return (
    <PageShell width="full">
      <AdminBackLink />
      <AnnounceNotices
        texts={{ label: toast('label'), region: toast('region'), close: toast('close') }}
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <PersonRecordHeader
            name={texts.header.name}
            avatar={{ url: avatar, alt: texts.header.photoAlt }}
            badge={texts.header.badge}
            levelLine={texts.header.levelLine}
            memberSince={texts.header.memberSince}
            suspension={texts.header.suspension}
            action={
              moderation === null ? null : (
                <RecordModeration
                  publicId={person.publicId}
                  suspensionId={person.suspension?.id ?? null}
                  texts={{ ...moderation, suspend: texts.suspend }}
                />
              )
            }
          />
          <div className="flex flex-col gap-10">
            {texts.parts.map(({ key, ...part }) => (
              <RecordSection key={key} {...part} />
            ))}
          </div>
        </div>
      </AnnounceNotices>
    </PageShell>
  )
}

async function moderationTexts(name: string) {
  const [suspendSheet, reactivate, suspend] = await Promise.all([
    suspendSheetTexts(name),
    reactivateSheetTexts(name),
    getTranslations('moderation.suspend'),
  ])
  return { suspendSheet, reactivate, suspended: suspend('done', { name }) }
}
