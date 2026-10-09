import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ApplicationForm } from '@/components/applications/application-form'
import { ApplicationHeader } from '@/components/applications/application-header'
import { ApplicationPetLayout } from '@/components/applications/application-pet-layout'
import { ContactLaterNote } from '@/components/applications/contact-later-note'
import { InProcessNote } from '@/components/applications/in-process-note'
import { NotReceiving } from '@/components/applications/not-receiving'
import { ProposedAnswersNote } from '@/components/applications/proposed-answers-note'
import { applyStoppedEvent, applyTappedEvent } from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'
import { applyGate } from '@/lib/applications/apply-gate'
import {
  AFTER_FLAG,
  AFTER_IDENTITY,
  AFTER_PHONE,
  applyAfterPhonePath,
  applyPath,
  myApplicationPath,
} from '@/lib/applications/paths'
import { proposedAnswers } from '@/lib/applications/proposed-answers'
import { requireProfile } from '@/lib/auth/require-profile'
import { signInWithNext } from '@/lib/auth/next-destination'
import { petPath } from '@/lib/pets/paths'
import { getApplyScreen, getPetApplicationView } from '@/lib/supabase/queries/applications'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { verifyPath } from '@/lib/verification/gate'
import { applicationFormTexts } from '@/app/[locale]/_components/application-texts'
import { IdentityRequiredScreen } from '@/app/[locale]/(app)/_components/identity-required-screen'
import { LimitScreen } from '@/app/[locale]/(app)/_components/limit-screen'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string; code: string }>
  searchParams: Promise<{ [AFTER_FLAG]?: string }>
}

const AFTER = { [AFTER_PHONE]: 'phone', [AFTER_IDENTITY]: 'identity' } as const

function afterOf(flag: string | undefined): 'phone' | 'identity' | null {
  return flag === AFTER_PHONE || flag === AFTER_IDENTITY ? AFTER[flag] : null
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.applications.apply')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// «Quiero adoptar» (contracts/routes.md): registra el toque —también sin sesión, antes de mandar a
// ingresar— y dibuja la pantalla que decide `applyGate`, en el orden de FR-003. Lo que ya tiene su
// pantalla en otro lado —la ficha propia, el animal de alguien que bloqueaste o que no recibe por su
// estado, Mi solicitud, el aviso del teléfono— redirige allá.
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

  // La rechazada lo lee en la ficha, que le dice que no fue aceptada (FR-023).
  if (gate.kind === 'own' || gate.kind === 'blocked_publisher' || gate.kind === 'rejected') {
    redirect(petPath(code))
  }
  if (gate.kind === 'has_active') redirect(myApplicationPath(gate.id))
  if (gate.kind === 'needs_phone') {
    redirect(verifyPath({ reason: 'apply', next: applyAfterPhonePath(code), from: petPath(code) }))
  }

  // Un animal que no recibe por su estado lo explica la ficha, que no dice el nombre de uno que no
  // se muestra ni por qué: esta ruta no sabe si se muestra y no puede contar más. El nombre se dice
  // solo a quien su publicador bloqueó, que ve el animal en la ficha (FR-063).
  if (
    gate.kind === 'unavailable' ||
    (gate.kind === 'not_receiving' && context.receiving !== 'yes')
  ) {
    redirect(petPath(code))
  }

  const name = pet.name
  if (gate.kind === 'not_receiving') {
    const t = await getTranslations('applications.not_receiving')
    return (
      <PageShell width="full">
        <NotReceiving
          texts={{ title: t('title', { name }), body: t('body'), toListing: t('to_listing') }}
        />
      </PageShell>
    )
  }

  if (gate.kind === 'limit') {
    return (
      <PageShell width="full">
        <LimitScreen name={name} cover={pet.cover} active={screen.active} />
      </PageShell>
    )
  }

  if (gate.kind === 'needs_identity') {
    return (
      <PageShell width="full">
        <IdentityRequiredScreen
          code={code}
          name={name}
          publisherName={pet.publisherName}
          cover={pet.cover}
        />
      </PageShell>
    )
  }

  const [t, texts] = await Promise.all([
    getTranslations('applications.form'),
    applicationFormTexts(name),
  ])
  return (
    <PageShell width="full">
      <ApplicationPetLayout
        cover={pet.cover}
        photoAlt={t('photo_alt', { name })}
        head={<ApplicationHeader texts={{ title: t('title', { name }), lead: t('lead') }} />}
      >
        <ApplicationForm
          code={code}
          accountId={user.id}
          isNeutered={pet.isNeutered}
          proposed={proposedAnswers(screen.lastAnswers, pet)}
          after={afterOf(query[AFTER_FLAG])}
          intro={gate.inProcess ? <InProcessNote text={t('in_process', { name })} /> : null}
          proposedNote={<ProposedAnswersNote text={t('proposed', { name })} />}
          contactNote={<ContactLaterNote text={t('contact_later')} />}
          texts={texts}
        />
      </ApplicationPetLayout>
    </PageShell>
  )
}
