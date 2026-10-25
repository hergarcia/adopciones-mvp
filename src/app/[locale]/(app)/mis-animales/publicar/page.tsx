import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PublishKindChoice } from '@/components/pets/publish-kind-choice'
import { homePublishTapEvent } from '@/lib/analytics/home-events'
import { trackAll } from '@/lib/analytics/track'
import { trackQuestionAction } from '@/lib/analytics/track-question-action'
import { requireVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { emptyLitterForm } from '@/lib/litters/empty-form'
import { PUBLISH_LITTER_PATH, PUBLISH_PET_PATH } from '@/lib/litters/paths'
import { uruguayDay } from '@/lib/pets/age'
import { PUBLISH_PATH, petGateRequest } from '@/lib/pets/paths'
import { EMPTY_PET_FORM } from '@/lib/pets/types'
import { litterFormTexts } from '@/app/[locale]/_components/litter-form-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { PetFormScreen } from '@/app/[locale]/_components/pet-form-screen'
import { petFormTexts } from '@/app/[locale]/_components/pet-form-texts'
import {
  departmentOptions,
  localitiesByDepartment,
} from '@/app/[locale]/_components/profile-form-texts'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { PublishFlow } from './publish-flow'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tipo?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pets.metadata.publish')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Primero, «¿Es un animal o una camada?» (FR-001); cada respuesta abre su formulario con la zona del
// perfil propuesta, y cambiarla no toca el perfil (FR-011 de la #53). Sin nivel 1, el aviso de
// verificación pendiente con la vuelta a la pantalla pedida (FR-002). El toque desde la portada se
// cuenta antes de la puerta: quien se queda en el ingreso o en el teléfono también tocó (research R6
// de la #61).
export default async function PublishPetPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()
  const [request, { tipo }] = await Promise.all([headers(), searchParams])
  const tap = homePublishTapEvent({ referer: request.get('referer'), host: request.get('host') })
  await Promise.all([trackAll(tap === null ? [] : [tap]), trackQuestionAction(PUBLISH_PATH)])
  const kind = tipo === 'animal' ? 'pet' : tipo === 'camada' ? 'litter' : null
  const here =
    kind === 'pet' ? PUBLISH_PET_PATH : kind === 'litter' ? PUBLISH_LITTER_PATH : PUBLISH_PATH
  const profile = await requireVerifiedPhone(petGateRequest(here))
  const zone = { department: profile.department, locality: profile.locality }
  const [form, choice] = await Promise.all([
    getTranslations('pets.form'),
    getTranslations('litters.choice'),
  ])

  if (kind === 'pet') {
    return (
      <PetFormScreen
        title={form('publish_title')}
        mode="publish"
        initial={{ ...EMPTY_PET_FORM, ...zone }}
        accountId={profile.id}
        returnTo={PUBLISH_PET_PATH}
      />
    )
  }

  if (kind === 'litter') {
    const [litterTexts, petTexts, young, litterForm] = await Promise.all([
      litterFormTexts(),
      petFormTexts('publish'),
      getTranslations('litters.young'),
      getTranslations('litters.form'),
    ])
    return (
      <PageShell width="full">
        <PublishFlow
          titles={{ litter: litterForm('title'), pet: form('publish_title') }}
          litterTexts={litterTexts}
          petTexts={petTexts}
          departments={departmentOptions()}
          localitiesByDepartment={localitiesByDepartment()}
          litterInitial={emptyLitterForm(zone, (number) => young('default_name', { number }))}
          accountId={profile.id}
          today={uruguayDay(new Date())}
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PublishKindChoice
        texts={{ title: choice('title'), question: choice('question') }}
        pet={{ href: PUBLISH_PET_PATH, label: choice('pet'), hint: choice('pet_hint') }}
        litter={{ href: PUBLISH_LITTER_PATH, label: choice('litter'), hint: choice('litter_hint') }}
      />
    </PageShell>
  )
}
