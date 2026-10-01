import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { HiddenFromPublicNotice } from '@/components/pets/hidden-from-public-notice'
import { PetSheet } from '@/components/pets/pet-sheet'
import { PetUnavailable } from '@/components/pets/pet-unavailable'
import { ShareButton } from '@/components/pets/share-button'
import { LinkButton } from '@/components/ui/link-button'
import { ToastProvider } from '@/components/ui/toast'
import { signInWithNext } from '@/lib/auth/next-destination'
import { petViewEvent } from '@/lib/analytics/listing-events'
import { trackAll } from '@/lib/analytics/track'
import { APP_NAME, INDEXING_ENABLED } from '@/lib/config'
import { uruguayDay } from '@/lib/pets/age'
import { MY_PETS_PATH, editPetPath, petPath, petShareImagePath } from '@/lib/pets/paths'
import { petPageState } from '@/lib/pets/pet-page-state'
import { getPublicPet } from '@/lib/supabase/queries/listed-pets'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { verifyPath } from '@/lib/verification/gate'
import { zoneName } from '@/lib/zones/zone-name'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { shareTexts } from '@/components/pets/share-texts'
import { StaleImagesRefresh } from '@/app/[locale]/_components/stale-images-refresh'

type Props = { params: Promise<{ locale: string; code: string }> }

const ROBOTS = { index: INDEXING_ENABLED, follow: INDEXING_ENABLED }

// Lo que leen WhatsApp y Facebook para la vista previa (FR-011, FR-012, contracts/routes.md): de un
// animal a la vista, su imagen, «{nombre} en adopción» y la zona; de uno oculto o que no existe,
// solo el nombre del sitio y «Animales en adopción».
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const [t, result] = await Promise.all([getTranslations('pets'), getPublicPet(code)])
  const listing = t('metadata.listing.title')
  if (result === null || result.visibility === 'hidden') {
    return {
      title: listing,
      robots: ROBOTS,
      openGraph: { type: 'website', siteName: APP_NAME, title: APP_NAME, description: listing },
      twitter: { card: 'summary', title: APP_NAME, description: listing },
    }
  }
  const title = t('share.title', { name: result.name })
  const description = t('metadata.pet.description', { zone: zoneName(result.zone) })
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
export default async function PetPage({ params }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale)

  const [t, result, user, request] = await Promise.all([
    getTranslations('pets'),
    getPublicPet(code),
    getSessionUser(),
    headers(),
  ])
  const state = petPageState(result, { signedIn: user !== null })

  // «No está publicado» se dibuja acá y no con `notFound()`: en Next 16 un 404 fuera de un límite
  // de `Suspense` llega con el cuerpo vacío y lo dibuja el cliente, así que sin ejecutar nada no se
  // vería nada (FR-019). Nada se indexa (FR-024), así que el 200 no cuesta nada.
  if (state.kind === 'missing' || state.kind === 'unavailable') {
    const missing = state.kind === 'missing'
    return (
      <PageShell width="full">
        <PetUnavailable
          signInHref={signInWithNext(petPath(code))}
          texts={{
            title: t(missing ? 'page.missing_title' : 'page.unavailable_title'),
            body: t(missing ? 'page.missing_body' : 'page.unavailable_body'),
            toListing: t('page.to_listing'),
            signIn: !missing && state.offerSignIn ? t('page.sign_in_to_see') : undefined,
          }}
        />
      </PageShell>
    )
  }

  const { pet } = state
  const isHidden = state.kind === 'own_hidden'
  const event = petViewEvent({
    visibility: pet.visibility,
    isOwner: pet.isOwner,
    referer: request.get('referer'),
    host: request.get('host'),
    userAgent: request.get('user-agent'),
  })
  const [, share, toast] = await Promise.all([
    trackAll(event === null ? [] : [event]),
    shareTexts(pet.name),
    getTranslations('common.toast'),
  ])

  return (
    <PageShell width="full">
      <StaleImagesRefresh signedAt={pet.signedAt} />
      <ToastProvider label={toast('label')} regionLabel={toast('region')}>
        <PetSheet
          pet={pet}
          today={uruguayDay(new Date())}
          notice={
            isHidden ? (
              <HiddenFromPublicNotice
                href={verifyPath({ reason: 'publish', next: petPath(code), from: MY_PETS_PATH })}
                texts={{
                  stamp: t('page.own_hidden_stamp'),
                  body: t('page.own_hidden_body'),
                  action: t('page.confirm_phone'),
                }}
              />
            ) : null
          }
          actions={
            <>
              {/* Oculto, el enlace muestra «no disponible por ahora»: «Compartir» pesa menos que
                  «Confirmar mi teléfono» del aviso (FR-020). */}
              <ShareButton
                code={pet.code}
                from="pet"
                texts={share}
                variant={isHidden ? 'ghost' : 'secondary'}
              />

              {state.kind === 'own_listed' && pet.editId !== null ? (
                <LinkButton href={editPetPath(pet.editId)} variant="ghost">
                  {t('page.edit')}
                </LinkButton>
              ) : null}
            </>
          }
        />
      </ToastProvider>
    </PageShell>
  )
}
