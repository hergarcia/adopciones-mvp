import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ApplicationForm } from '@/components/applications/application-form'
import { ApplicationHeader } from '@/components/applications/application-header'
import { ContactLaterNote } from '@/components/applications/contact-later-note'
import { InProcessNote } from '@/components/applications/in-process-note'
import { NotReceiving } from '@/components/applications/not-receiving'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { applyStoppedEvent, applyTappedEvent } from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'
import { applyGate } from '@/lib/applications/apply-gate'
import {
  AFTER_FLAG,
  AFTER_PHONE,
  MY_APPLICATIONS_PATH,
  applyAfterPhonePath,
  applyPath,
  myApplicationPath,
} from '@/lib/applications/paths'
import { requireProfile } from '@/lib/auth/require-profile'
import { signInWithNext } from '@/lib/auth/next-destination'
import { petPath } from '@/lib/pets/paths'
import { getApplyScreen, getPetApplicationView } from '@/lib/supabase/queries/applications'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { verifyPath } from '@/lib/verification/gate'
import { applicationFormTexts } from '@/app/[locale]/_components/application-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string; code: string }>
  searchParams: Promise<{ [AFTER_FLAG]?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.applications.apply')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// «Quiero adoptar» (contracts/routes.md): registra el toque —también sin sesión, antes de mandar a
// ingresar— y dibuja la pantalla que decide `applyGate`, en el orden de FR-003. Lo que ya tiene su
// pantalla en otro lado —la ficha propia, el animal de alguien que bloqueaste, Mi solicitud, el
// aviso del teléfono— redirige allá.
export default async function ApplyPage({ params, searchParams }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale)
  const path = applyPath(code)

  const user = await getSessionUser()
  if (user === null) {
    const view = await getPetApplicationView(code)
    if (view === null) redirect(petPath(code))
    await trackAll([applyTappedEvent({ signedIn: false, level: 0, required: view.requiredLevel })])
    redirect(signInWithNext(path))
  }
  await requireProfile(path)

  const [screen, query] = await Promise.all([getApplyScreen(user.id, code), searchParams])
  if (screen === null) redirect(petPath(code))
  const { context, pet } = screen
  const gate = applyGate(context)
  const stopped = applyStoppedEvent(gate.kind)
  await trackAll([
    applyTappedEvent({ signedIn: true, level: screen.level, required: context.requiredLevel }),
    ...(stopped === null ? [] : [stopped]),
  ])

  if (gate.kind === 'own' || gate.kind === 'blocked_publisher') redirect(petPath(code))
  if (gate.kind === 'has_active') redirect(myApplicationPath(gate.id))
  if (gate.kind === 'needs_phone') {
    redirect(verifyPath({ reason: 'apply', next: applyAfterPhonePath(code), from: petPath(code) }))
  }

  const name = pet.name
  if (gate.kind === 'not_receiving' || gate.kind === 'unavailable') {
    const t = await getTranslations('applications.not_receiving')
    return (
      <PageShell width="full">
        <NotReceiving
          texts={{
            title: t(gate.kind === 'unavailable' ? 'unavailable_title' : 'title', { name }),
            body: t('body'),
            toListing: t('to_listing'),
          }}
        />
      </PageShell>
    )
  }

  // El límite y la identidad tienen su pantalla entera en las user stories que los construyen (US2,
  // US3); hasta entonces, el freno con su único camino.
  if (gate.kind === 'limit' || gate.kind === 'needs_identity') {
    const t = await getTranslations('applications')
    const limit = gate.kind === 'limit'
    return (
      <PageShell width="full">
        <HeadedEmptyState
          title={limit ? t('limit.title') : t('identity.title', { name })}
          body={limit ? t('limit.body', { name }) : t('identity.body')}
          action={
            <LinkButton
              href={limit ? MY_APPLICATIONS_PATH : '/verificar-identidad?pedir=1'}
              variant={limit ? 'secondary' : 'tirita'}
            >
              {limit ? t('limit.to_mine') : t('identity.verify')}
            </LinkButton>
          }
        />
      </PageShell>
    )
  }

  const [t, texts] = await Promise.all([
    getTranslations('applications.form'),
    applicationFormTexts(name),
  ])
  return (
    <PageShell className="flex flex-col gap-8">
      <ApplicationHeader
        cover={pet.cover}
        texts={{
          title: t('title', { name }),
          photoAlt: t('photo_alt', { name }),
          lead: t('lead'),
        }}
      />
      <ApplicationForm
        code={code}
        accountId={user.id}
        isNeutered={pet.isNeutered}
        initial={{}}
        proposed={false}
        after={query[AFTER_FLAG] === AFTER_PHONE ? 'phone' : null}
        intro={gate.inProcess ? <InProcessNote text={t('in_process', { name })} /> : null}
        contactNote={<ContactLaterNote text={t('contact_later')} />}
        texts={texts}
      />
    </PageShell>
  )
}
