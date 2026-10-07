import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PetSheet } from '@/components/pets/pet-sheet'
import { PetStatusStamp } from '@/components/pets/pet-status-stamp'
import { ShareButton } from '@/components/pets/share-button'
import { LinkButton } from '@/components/ui/link-button'
import { petViewEvent } from '@/lib/analytics/listing-events'
import { trackAll } from '@/lib/analytics/track'
import { APP_NAME, INDEXING_ENABLED } from '@/lib/config'
import { uruguayDay } from '@/lib/pets/age'
import { LISTING_PATH, editPetPath, petPath, petShareImagePath } from '@/lib/pets/paths'
import { petPageState } from '@/lib/pets/pet-page-state'
import type { PetVisibility } from '@/lib/pets/types'
import { applyActionKind } from '@/lib/applications/apply-action'
import { getPetApplicationView } from '@/lib/supabase/queries/applications'
import { getPublicPet } from '@/lib/supabase/queries/listed-pets'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { zoneName } from '@/lib/zones/zone-name'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { shareTexts } from '@/components/pets/share-texts'
import { StaleImagesRefresh } from '@/app/[locale]/_components/stale-images-refresh'
import { BlockedPetScreen } from './_components/blocked-pet-screen'
import { petApplyAction } from './_components/pet-apply-action'
import { OwnHiddenNotice } from './_components/own-hidden-notice'
import { UnavailableScreen } from './_components/unavailable-screen'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { BLOCKED_FLAG, parseBlockedNotice } from '@/lib/moderation/paths'
import { blockedNoticeText } from '@/app/[locale]/_components/moderation-texts'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'

type Props = {
  params: Promise<{ locale: string; code: string }>
  searchParams: Promise<{ [BLOCKED_FLAG]?: string }>
}

const ROBOTS = { index: INDEXING_ENABLED, follow: INDEXING_ENABLED }

/** Lo que cualquiera ve como ficha: a la vista o adoptada. */
function isShown(pet: { visibility: PetVisibility }): boolean {
  return pet.visibility === 'listed' || pet.visibility === 'adopted'
}

// Lo que leen WhatsApp y Facebook para la vista previa (FR-011, FR-012, contracts/routes.md): de un
// animal a la vista, su imagen, «{nombre} en adopción» y la zona; de uno adoptado, su imagen y que
// fue adoptado; de uno oculto o que no existe, solo el nombre del sitio y «Animales en adopción».
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const [t, result] = await Promise.all([getTranslations('pets'), getPublicPet(code)])
  const listing = t('metadata.listing.title')
  if (result === null || !('code' in result) || !isShown(result)) {
    return {
      title: listing,
      robots: ROBOTS,
      openGraph: { type: 'website', siteName: APP_NAME, title: APP_NAME, description: listing },
      twitter: { card: 'summary', title: APP_NAME, description: listing },
    }
  }
  // La adoptada dice que fue adoptada, sin la zona (FR-011): ya no se busca dónde está.
  const adopted = result.visibility === 'adopted'
  const title = adopted
    ? t('share.adopted_title', { name: result.name, sex: result.sex })
    : t('share.title', { name: result.name })
  const description = adopted
    ? listing
    : t('metadata.pet.description', { zone: zoneName(result.zone) })
  const image = { url: petShareImagePath(code, result.version), width: 1200, height: 630 }
  return {
    title,
    description,
    alternates: { canonical: petPath(code) },
    robots: ROBOTS,
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      title,
      description,
      url: petPath(code),
      images: [{ ...image, type: 'image/jpeg', alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  }
}

// La ficha pública (historia #57): se ve sin ingresar, y cada uno ve lo que le toca según
// `petPageState` (research R10).
export default async function PetPage({ params, searchParams }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()

  const [t, result, user, request, query] = await Promise.all([
    getTranslations('pets'),
    getPublicPet(code),
    getSessionUser(),
    headers(),
    searchParams,
  ])
  const state = petPageState(result, { signedIn: user !== null })

  // «No está publicado» se dibuja acá y no con `notFound()`: en Next 16 un 404 fuera de un límite
  // de `Suspense` llega con el cuerpo vacío y lo dibuja el cliente, así que sin ejecutar nada no se
  // vería nada (FR-019). Nada se indexa (FR-024), así que el 200 no cuesta nada.
  if (state.kind === 'blocked') {
    return (
      <PageShell width="full">
        <BlockedPetScreen code={code} publisherPublicId={state.publisherPublicId} />
      </PageShell>
    )
  }

  if (!('pet' in state)) {
    return (
      <PageShell width="full">
        <UnavailableScreen
          code={code}
          kind={state.kind}
          offerSignIn={state.kind === 'unavailable' && state.offerSignIn}
        />
      </PageShell>
    )
  }

  const { pet } = state
  const isHidden = state.kind === 'own_hidden'
  const adopted = pet.visibility === 'adopted'
  const event = petViewEvent({
    visibility: pet.visibility,
    isOwner: pet.isOwner,
    referer: request.get('referer'),
    host: request.get('host'),
    userAgent: request.get('user-agent'),
  })
  // La lectura chica de «Quiero adoptar» (research R8): una adoptada no la necesita. La dueña sí,
  // para ver en su ficha lo que eligió en «Quién puede solicitar» (US3-AS1).
  const asksToApply = !adopted
  const [, share, toast, applying, applyTexts] = await Promise.all([
    trackAll(event === null ? [] : [event]),
    shareTexts(pet.name),
    getTranslations('common.toast'),
    asksToApply ? getPetApplicationView(code) : null,
    getTranslations('applications.ficha'),
  ])
  const myActiveId = applying?.myActiveId ?? null
  // Vuelve de «Desbloquear» en el animal de alguien que bloqueaste.
  const notice = user === null ? null : parseBlockedNotice(query[BLOCKED_FLAG])
  const apply = petApplyAction({
    code,
    kind: applyActionKind({ isOwner: pet.isOwner, state: pet.state, myActiveId }),
    myActiveId,
    requiredLevel: applying?.requiredLevel ?? null,
    adopted,
    isOwner: pet.isOwner,
    texts: {
      apply: applyTexts('apply'),
      viewMine: applyTexts('view_mine'),
      requiredLevel: applyTexts('required_level'),
      toListing: t('page.to_listing'),
    },
  })

  return (
    <PageShell width="full">
      {notice === null ? null : (
        <ScreenToast message={await blockedNoticeText(notice, pet.publisher.name)} />
      )}
      <StaleImagesRefresh signedAt={pet.signedAt} />
      <PetSheet
        pet={pet}
        today={uruguayDay(new Date())}
        notice={isHidden ? <OwnHiddenNotice pet={pet} reason={state.reason} /> : null}
        stamp={
          pet.state === 'in_process' ? (
            <PetStatusStamp
              state={pet.state}
              label={t('status.stamp', { state: pet.state, sex: pet.sex })}
            />
          ) : null
        }
        photoStamp={
          pet.state === 'adopted' ? (
            <PetStatusStamp
              state={pet.state}
              size="lg"
              label={t('status.stamp', { state: pet.state, sex: pet.sex })}
            />
          ) : null
        }
        stickyAction={apply.sticky}
        actions={
          <>
            {apply.aside}

            {/* Oculto, el enlace muestra «no disponible por ahora»: «Compartir» pesa menos que
                «Confirmar mi teléfono» del aviso (FR-020). */}
            <ShareButton
              code={pet.code}
              from="pet"
              texts={share}
              variant={isHidden ? 'ghost' : 'secondary'}
              region="own"
              toast={{ label: toast('label'), region: toast('region') }}
            />

            {state.kind === 'own_listed' && pet.editId !== null ? (
              <LinkButton href={editPetPath(pet.editId)} variant="ghost">
                {t('page.edit')}
              </LinkButton>
            ) : null}

            {adopted && pet.isOwner ? (
              <LinkButton href={LISTING_PATH} variant="secondary">
                {t('page.to_listing')}
              </LinkButton>
            ) : null}
          </>
        }
      />
    </PageShell>
  )
}
