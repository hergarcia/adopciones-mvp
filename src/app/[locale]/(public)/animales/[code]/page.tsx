import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PetSheet } from '@/components/pets/pet-sheet'
import { PetUnavailable } from '@/components/pets/pet-unavailable'
import { LinkButton } from '@/components/ui/link-button'
import { signInWithNext } from '@/lib/auth/next-destination'
import { petViewEvent } from '@/lib/analytics/listing-events'
import { trackAll } from '@/lib/analytics/track'
import { INDEXING_ENABLED } from '@/lib/config'
import { uruguayDay } from '@/lib/pets/age'
import { editPetPath, petPath } from '@/lib/pets/paths'
import { petPageState } from '@/lib/pets/pet-page-state'
import { getPublicPet } from '@/lib/supabase/queries/listed-pets'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { zoneName } from '@/lib/zones/zone-name'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { StaleImagesRefresh } from '@/app/[locale]/_components/stale-images-refresh'

type Props = { params: Promise<{ locale: string; code: string }> }

const ROBOTS = { index: INDEXING_ENABLED, follow: INDEXING_ENABLED }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const [t, result] = await Promise.all([getTranslations('pets'), getPublicPet(code)])
  if (result === null || result.visibility === 'hidden') {
    return { title: t('metadata.listing.title'), robots: ROBOTS }
  }
  return {
    title: t('share.title', { name: result.name }),
    description: t('metadata.pet.description', { zone: zoneName(result.zone) }),
    alternates: { canonical: petPath(code) },
    robots: ROBOTS,
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
  if (state.kind === 'missing') notFound()

  if (state.kind === 'unavailable') {
    return (
      <PageShell width="full">
        <PetUnavailable
          signInHref={signInWithNext(petPath(code))}
          texts={{
            title: t('page.unavailable_title'),
            body: t('page.unavailable_body'),
            toListing: t('page.to_listing'),
            signIn: state.offerSignIn ? t('page.sign_in_to_see') : undefined,
          }}
        />
      </PageShell>
    )
  }

  const { pet } = state
  const event = petViewEvent({
    visibility: pet.visibility,
    isOwner: pet.isOwner,
    referer: request.get('referer'),
    host: request.get('host'),
    userAgent: request.get('user-agent'),
  })
  await trackAll(event === null ? [] : [event])

  return (
    <PageShell width="full">
      <StaleImagesRefresh signedAt={pet.signedAt} />
      <PetSheet
        pet={pet}
        today={uruguayDay(new Date())}
        actions={
          state.kind === 'own_listed' && pet.editId !== null ? (
            <LinkButton href={editPetPath(pet.editId)} variant="ghost">
              {t('page.edit')}
            </LinkButton>
          ) : null
        }
      />
    </PageShell>
  )
}
