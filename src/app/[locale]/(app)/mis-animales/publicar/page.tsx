import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { homePublishTapEvent } from '@/lib/analytics/home-events'
import { trackAll } from '@/lib/analytics/track'
import { requireVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { PUBLISH_PATH, petGateRequest } from '@/lib/pets/paths'
import { EMPTY_PET_FORM } from '@/lib/pets/types'
import { PetFormScreen } from '@/app/[locale]/_components/pet-form-screen'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pets.metadata.publish')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// La zona del perfil viene propuesta y cambiarla no toca el perfil (FR-011). Sin nivel 1, el aviso
// de verificación pendiente con la vuelta acá (FR-001). El toque desde la portada se cuenta antes de
// la puerta: quien se queda en el ingreso o en el teléfono también tocó (research R6 de la #61).
export default async function PublishPetPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()
  const request = await headers()
  const tap = homePublishTapEvent({ referer: request.get('referer'), host: request.get('host') })
  await trackAll(tap === null ? [] : [tap])
  const profile = await requireVerifiedPhone(petGateRequest(PUBLISH_PATH))
  const t = await getTranslations('pets.form')

  return (
    <PetFormScreen
      title={t('publish_title')}
      mode="publish"
      initial={{ ...EMPTY_PET_FORM, department: profile.department, locality: profile.locality }}
      accountId={profile.id}
      returnTo={PUBLISH_PATH}
    />
  )
}
