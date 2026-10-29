import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { RequiredLevelLine } from '@/components/applications/required-level-line'
import { LitterSheet } from '@/components/litters/litter-sheet'
import { GroupPostButton } from '@/components/pets/group-post-button'
import { litterGroupPost } from '@/components/pets/group-post-texts'
import { ShareButton } from '@/components/pets/share-button'
import { sharePreviewDescription } from '@/components/pets/share-preview-texts'
import { shareImageVersion } from '@/lib/pets/share-image-version'
import { shareTexts } from '@/components/pets/share-texts'
import { LinkButton } from '@/components/ui/link-button'
import { petViewEvent } from '@/lib/analytics/listing-events'
import { trackAll } from '@/lib/analytics/track'
import { visitMarks } from '@/lib/analytics/visit-origin'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { APP_NAME, INDEXING_ENABLED } from '@/lib/config'
import { litterPageState } from '@/lib/litters/litter-page-state'
import { litterEditPath, litterPath, litterShareImagePath } from '@/lib/litters/paths'
import { LISTING_PATH } from '@/lib/pets/paths'
import { getLitterByCode } from '@/lib/supabase/queries/litters'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { zoneName } from '@/lib/zones/zone-name'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { publisherHasOtherPets } from '@/app/[locale]/_components/other-pets'
import { StaleImagesRefresh } from '@/app/[locale]/_components/stale-images-refresh'
import {
  BlockedLitterScreen,
  LitterUnavailableScreen,
  OwnHiddenLitterNotice,
} from './_components/litter-screens'
import { youngApplyActions } from './_components/young-apply-actions'

type Props = {
  params: Promise<{ locale: string; code: string }>
  // `desde` y `utm_source` dicen de dónde llegó la visita; los metadatos no los leen, así el enlace
  // con la marca de Compartir arma la misma tarjeta (FR-024 de la #169).
  searchParams: Promise<{ desde?: string | string[]; utm_source?: string | string[] }>
}

const ROBOTS = { index: INDEXING_ENABLED, follow: INDEXING_ENABLED }

// La vista previa (FR-036): de una camada a la vista, su portada, «{nombre} en adopción», la zona y
// el nivel de quien publicó; de cualquier otra, solo el nombre del sitio y «Animales en adopción».
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const [t, pets, result] = await Promise.all([
    getTranslations('litters.meta'),
    getTranslations('pets'),
    getLitterByCode(code),
  ])
  const listing = pets('metadata.listing.title')
  if (result === null || !('code' in result) || result.visibility !== 'listed') {
    return {
      title: listing,
      robots: ROBOTS,
      openGraph: { type: 'website', siteName: APP_NAME, title: APP_NAME, description: listing },
      twitter: { card: 'summary', title: APP_NAME, description: listing },
    }
  }
  // Adoptada entera, dice que fue adoptada y sin la zona, como un animal adoptado (FR-020).
  const adopted = result.state === 'adopted'
  const title = adopted
    ? pets('share.adopted_title', { name: result.name, sex: 'female' })
    : t('title', { name: result.name })
  const description = await sharePreviewDescription({
    zone: zoneName(result.zone),
    adopted,
    level: result.publisher.level,
  })
  const image = {
    url: litterShareImagePath(code, shareImageVersion(result.version, result.publisher.level)),
    width: 1200,
    height: 630,
  }
  return {
    title,
    description,
    alternates: { canonical: litterPath(code) },
    robots: ROBOTS,
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      title,
      description,
      url: litterPath(code),
      images: [{ ...image, type: 'image/jpeg', alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  }
}

// La ficha de la camada (US2): se ve sin ingresar, y cada uno ve lo que le toca según
// `litterPageState`. «No está publicada» se dibuja acá y no con `notFound()`, como la de un animal:
// un 404 fuera de `Suspense` llega vacío sin ejecutar nada (FR-033). Sin `loading.tsx` por lo mismo:
// con él la ficha llegaría en un segundo envío que solo se muestra ejecutando JavaScript.
export default async function LitterPage({ params, searchParams }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()

  const [result, user, request, query] = await Promise.all([
    getLitterByCode(code),
    getSessionUser(),
    headers(),
    searchParams,
  ])
  const state = litterPageState(result, { signedIn: user !== null })

  if (state.kind === 'blocked') {
    return (
      <PageShell width="full">
        <BlockedLitterScreen code={code} publisherPublicId={state.publisherPublicId} />
      </PageShell>
    )
  }
  if (
    state.kind === 'missing' ||
    state.kind === 'unavailable' ||
    state.kind === 'paused' ||
    state.kind === 'expired'
  ) {
    return (
      <PageShell width="full">
        <LitterUnavailableScreen
          code={code}
          kind={state.kind}
          offerSignIn={state.kind === 'unavailable' && state.offerSignIn}
        />
      </PageShell>
    )
  }

  const { litter } = state
  const event = petViewEvent({
    visibility: litter.visibility,
    isOwner: litter.isOwner,
    referer: request.get('referer'),
    host: request.get('host'),
    userAgent: request.get('user-agent'),
    ...visitMarks(query),
    litter: true,
    publisherLevel: litter.publisher.level,
  })
  const [, t, share, groupPost, toast, apply, youngActions, hasOtherPets] = await Promise.all([
    trackAll(event === null ? [] : [event]),
    getTranslations('pets.page'),
    shareTexts(litter.name),
    litterGroupPost(litter),
    getTranslations('common.toast'),
    getTranslations('applications.ficha'),
    youngApplyActions(litter),
    // Ni adoptada entera ni oculta (historia #242); la camada misma no cuenta como otro animal.
    litter.visibility === 'listed' && litter.state !== 'adopted'
      ? publisherHasOtherPets(litter.publisher, litter.code)
      : false,
  ])
  const isHidden = state.kind === 'own_hidden'

  return (
    <PageShell width="full">
      <StaleImagesRefresh signedAt={litter.signedAt} />
      <LitterSheet
        litter={litter}
        now={new Date()}
        notice={isHidden ? <OwnHiddenLitterNotice litter={litter} reason={state.reason} /> : null}
        requiredLevel={
          litter.requiredLevel === 2 ? <RequiredLevelLine text={apply('required_level')} /> : null
        }
        youngActions={youngActions}
        hasOtherPets={hasOtherPets}
        actions={
          <>
            <ShareButton
              code={litter.code}
              path={litterPath(litter.code)}
              from="pet"
              texts={share}
              variant={isHidden ? 'ghost' : 'secondary'}
              region="own"
              toast={{ label: toast('label'), region: toast('region') }}
            />
            {groupPost === null ? null : (
              <GroupPostButton
                from="pet_group_text"
                texts={groupPost}
                region="own"
                toast={{ label: toast('label'), region: toast('region') }}
              />
            )}
            {litter.editId === null || litter.takedown !== null ? null : (
              <LinkButton href={litterEditPath(litter.editId)} variant="ghost">
                {t('edit')}
              </LinkButton>
            )}
            {litter.state === 'adopted' ? (
              <LinkButton href={LISTING_PATH} variant="secondary">
                {t('to_listing')}
              </LinkButton>
            ) : null}
          </>
        }
      />
    </PageShell>
  )
}
