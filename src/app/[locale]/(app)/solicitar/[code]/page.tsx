import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ApplicationForm } from '@/components/applications/application-form'
import { ApplicationHeader } from '@/components/applications/application-header'
import { ApplicationPetLayout } from '@/components/applications/application-pet-layout'
import { ContactLaterNote } from '@/components/applications/contact-later-note'
import { FormNote } from '@/components/applications/form-note'
import { InProcessNote } from '@/components/applications/in-process-note'
import { NotReceiving } from '@/components/applications/not-receiving'
import { ProposedAnswersNote } from '@/components/applications/proposed-answers-note'
import { applyStoppedEvent, applyTappedEvent } from '@/lib/analytics/application-events'
import type { TrackedEvent } from '@/lib/analytics/events'
import { TAP_FLAG, parseTap, tapEvents, withTap } from '@/lib/analytics/apply-tap'
import { trackAll } from '@/lib/analytics/track'
import { deliver } from '@/lib/delivery/deliver'
import { applyCountOf } from '@/lib/pet-stats/count-rules'
import { applyGate } from '@/lib/applications/apply-gate'
import {
  AFTER_FLAG,
  AFTER_IDENTITY,
  AFTER_PHONE,
  HOLD_FLAG,
  LITTER_FLAG,
  MY_APPLICATIONS_PATH,
  applyAfterPhonePath,
  applyPath,
  applyReturnPath,
  applyYoungPath,
  myApplicationPath,
} from '@/lib/applications/paths'
import { proposedAnswers } from '@/lib/applications/proposed-answers'
import { requireProfile } from '@/lib/auth/require-profile'
import { signInWithNext } from '@/lib/auth/next-destination'
import { YoungGone } from '@/components/litters/young-gone'
import { litterPath } from '@/lib/litters/paths'
import { petPath } from '@/lib/pets/paths'
import { PET_CODE_PATTERN } from '@/lib/pets/rules'
import { getApplyScreen, getPetApplicationView } from '@/lib/supabase/queries/applications'
import { getLitterByCode } from '@/lib/supabase/queries/litters'
import { getPetPublisherLevel } from '@/lib/supabase/queries/measured-levels'
import { countApplyTap } from '@/lib/supabase/queries/publication-stats'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { verifyPath } from '@/lib/verification/gate'
import {
  applicationFormTexts,
  heldFormTexts,
  heldLineText,
} from '@/app/[locale]/_components/application-texts'
import { IdentityRequiredScreen } from '@/app/[locale]/(app)/_components/identity-required-screen'
import { LimitScreen } from '@/app/[locale]/(app)/_components/limit-screen'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string; code: string }>
  searchParams: Promise<{
    [AFTER_FLAG]?: string
    [LITTER_FLAG]?: string
    [TAP_FLAG]?: string
    [HOLD_FLAG]?: string
  }>
}

const AFTER = { [AFTER_PHONE]: 'phone', [AFTER_IDENTITY]: 'identity' } as const

function afterOf(flag: string | undefined): 'phone' | 'identity' | null {
  return flag === AFTER_PHONE || flag === AFTER_IDENTITY ? AFTER[flag] : null
}

// Un animal que no existe va a su ficha, que lo dice; una cría que se quitó lo dice acá, con la
// vuelta a su camada (FR-032 de la #205).
async function goneOrMissing(code: string, litterCode: string | null) {
  if (litterCode === null) redirect(petPath(code))
  const t = await getTranslations('litters.page')
  return (
    <PageShell width="full">
      <YoungGone
        href={litterPath(litterCode)}
        texts={{ title: t('young_gone_title'), body: t('young_gone'), toLitter: t('to_litter') }}
      />
    </PageShell>
  )
}

// El nombre de una cría adoptada se dice solo a quien ve su camada en la ficha: con la camada pausada,
// vencida, de una cuenta suspendida o de quien lo bloqueó, sigue el camino de siempre, que no lo dice.
async function showsAdoptedYoung(code: string, litterCode: string, blockedByPublisher: boolean) {
  if (blockedByPublisher) return false
  const litter = await getLitterByCode(litterCode)
  return litter?.visibility === 'listed' && litter.young.some((one) => one.code === code)
}

// Una cría que ya encontró hogar lo dice acá, con la vuelta a su camada (#206, FR-022).
async function youngAdopted(name: string, litterCode: string) {
  const t = await getTranslations('litters.page')
  return (
    <PageShell width="full">
      <YoungGone
        href={litterPath(litterCode)}
        texts={{
          title: t('young_adopted_title', { name }),
          body: t('young_adopted'),
          toLitter: t('to_litter'),
        }}
      />
    </PageShell>
  )
}

// «Cómo le va a…» (historia #269) suma de los mismos momentos que la medición, así los dos no pueden
// contar distinto; sale después de responder y nunca frena el camino (FR-004, FR-009).
function countTap(code: string, viewer: string | null, events: TrackedEvent[]) {
  const count = applyCountOf(events)
  deliver(() => countApplyTap(code, viewer, count))
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.applications.apply')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// «Quiero adoptar» (contracts/routes.md): registra el toque —también sin sesión, antes de mandar a
// ingresar— y dibuja la pantalla que decide `applyGate`, en el orden de FR-003. Lo que ya tiene su
// pantalla en otro lado —la ficha propia, el animal de alguien que bloqueaste o que no recibe por su
// estado, Mi solicitud, el aviso del teléfono— redirige allá. La pantalla que se dibuja acá se vuelve
// a pedir sin la marca del toque: recargarla o mandar el cuestionario no lo cuentan de nuevo (#240).
export default async function ApplyPage({ params, searchParams }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale)
  const query = await searchParams
  // El botón de una cría lleva el código de su camada (#205): la vuelta si la cría ya no está.
  const litterParam = query[LITTER_FLAG]
  const litterCode =
    litterParam !== undefined && PET_CODE_PATTERN.test(litterParam) ? litterParam : null
  const litter = litterCode !== null
  const path = litterCode === null ? applyPath(code) : applyYoungPath(code, litterCode)
  const afterFlag = query[AFTER_FLAG]
  const landing =
    afterFlag === AFTER_PHONE || afterFlag === AFTER_IDENTITY
      ? applyReturnPath(code, litterCode, afterFlag)
      : path
  const tap = parseTap(query[TAP_FLAG])
  // Solo para medir el toque (#236): nunca lanza y se lee a la par de la sesión y la pantalla.
  const publisherLevel = getPetPublisherLevel(code)

  const user = await getSessionUser()
  if (user === null) {
    const view = await getPetApplicationView(code)
    if (view === null) return goneOrMissing(code, litterCode)
    const tapped = applyTappedEvent({
      signedIn: false,
      level: 0,
      required: view.requiredLevel,
      litter,
      publisherLevel: await publisherLevel,
    })
    const { events, next } = tapEvents(tap, tapped, null)
    countTap(code, null, events)
    await trackAll(events)
    redirect(signInWithNext(next === null ? path : withTap(path, next)))
  }
  await requireProfile(tap === null ? path : withTap(path, tap))

  const screen = await getApplyScreen(user.id, code)
  if (screen === null) return goneOrMissing(code, litterCode)
  const { context, pet } = screen
  if (
    litterCode !== null &&
    pet.isAdopted &&
    !context.isOwner &&
    (await showsAdoptedYoung(code, litterCode, context.blockedByPublisher))
  ) {
    return youngAdopted(pet.name, litterCode)
  }
  const gate = applyGate(context)
  const tapped = applyTappedEvent({
    signedIn: true,
    level: screen.level,
    required: context.requiredLevel,
    litter,
    publisherLevel: await publisherLevel,
  })
  const { events, next } = tapEvents(tap, tapped, applyStoppedEvent(gate, litter))
  countTap(code, user.id, events)
  await trackAll(events)

  // La rechazada lo lee en la ficha, que le dice que no fue aceptada (FR-023).
  if (gate.kind === 'own' || gate.kind === 'blocked_publisher' || gate.kind === 'rejected') {
    redirect(petPath(code))
  }
  if (gate.kind === 'has_active') redirect(myApplicationPath(gate.id))
  if (gate.kind === 'needs_phone') {
    const back = applyAfterPhonePath(code, litterCode)
    redirect(
      verifyPath({
        reason: 'apply',
        next: next === null ? back : withTap(back, next),
        from: litterCode === null ? petPath(code) : litterPath(litterCode),
      }),
    )
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
  if (tap !== null) redirect(landing)

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

  // La que dejó escrita esperando la identidad (historia #289): si quien publicó dejó de pedirla, la
  // pantalla de identidad ya no corresponde y la lleva a verla en «Mis solicitudes».
  if (gate.kind === 'has_held' && context.requiredLevel !== 2) redirect(MY_APPLICATIONS_PATH)
  const holding = gate.kind === 'needs_identity' && gate.canHold && query[HOLD_FLAG] === '1'
  if (gate.kind === 'has_held' || (gate.kind === 'needs_identity' && !holding)) {
    return (
      <PageShell width="full">
        <IdentityRequiredScreen
          code={code}
          litterCode={litterCode}
          name={name}
          publisherName={pet.publisherName}
          cover={pet.cover}
          offer={gate.kind === 'has_held' ? 'held' : gate.canHold ? 'hold' : null}
        />
      </PageShell>
    )
  }

  const [t, texts, holdLine] = await Promise.all([
    getTranslations('applications.form'),
    holding ? heldFormTexts(name) : applicationFormTexts(name),
    holding ? heldLineText(pet.publisherName) : null,
  ])
  const inProcess = context.inProcess
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
          litterCode={litterCode}
          intro={inProcess ? <InProcessNote text={t('in_process', { name })} /> : null}
          proposedNote={<ProposedAnswersNote text={t('proposed', { name })} />}
          contactNote={<ContactLaterNote text={t('contact_later')} />}
          texts={texts}
          mode={holding ? 'hold' : 'send'}
          holdNote={holdLine === null ? null : <FormNote>{holdLine}</FormNote>}
        />
      </ApplicationPetLayout>
    </PageShell>
  )
}
