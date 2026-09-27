import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PetForm } from '@/components/pets/pet-form'
import { requireVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { PUBLISH_PATH, petGateRequest } from '@/lib/pets/paths'
import { EMPTY_PET_FORM } from '@/lib/pets/types'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { petFormTexts } from '@/app/[locale]/_components/pet-form-texts'
import {
  departmentOptions,
  localitiesByDepartment,
} from '@/app/[locale]/_components/profile-form-texts'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pets.metadata.publish')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// La zona del perfil viene propuesta y cambiarla no toca el perfil (FR-011). Sin nivel 1, el aviso
// de verificación pendiente con la vuelta acá (FR-001).
export default async function PublishPetPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const profile = await requireVerifiedPhone(petGateRequest(PUBLISH_PATH))
  const [t, texts] = await Promise.all([getTranslations('pets.form'), petFormTexts('publish')])

  return (
    <PageShell>
      <h1 className="afiche text-2xl text-ink">{t('publish_title')}</h1>
      <PetForm
        texts={texts}
        departments={departmentOptions()}
        localitiesByDepartment={localitiesByDepartment()}
        initial={{ ...EMPTY_PET_FORM, department: profile.department, locality: profile.locality }}
        accountId={profile.id}
        returnTo={PUBLISH_PATH}
      />
    </PageShell>
  )
}
