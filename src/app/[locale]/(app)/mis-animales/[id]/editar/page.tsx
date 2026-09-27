import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PetForm } from '@/components/pets/pet-form'
import { requireVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { petFormValuesOf } from '@/lib/pets/form-data'
import { editPetPath, petGateRequest } from '@/lib/pets/paths'
import { publishedSlot } from '@/lib/pets/photo-source'
import { getMyPet } from '@/lib/supabase/queries/pets'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { petFormTexts } from '@/app/[locale]/_components/pet-form-texts'
import {
  departmentOptions,
  localitiesByDepartment,
} from '@/app/[locale]/_components/profile-form-texts'

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pets.metadata.edit')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Editar lo publicado también es publicar: la misma puerta, con la vuelta a este animal (FR-001).
// Uno ajeno o que no existe es el mismo «Este animal no existe» (FR-005).
export default async function EditPetPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const path = editPetPath(id)
  const profile = await requireVerifiedPhone(petGateRequest(path))
  const [pet, t, texts] = await Promise.all([
    getMyPet(id),
    getTranslations('pets.form'),
    petFormTexts('edit'),
  ])
  if (pet === null) notFound()

  return (
    <PageShell width="full">
      <h1 className="afiche text-2xl text-ink">{t('edit_title', { name: pet.name })}</h1>
      <PetForm
        texts={texts}
        departments={departmentOptions()}
        localitiesByDepartment={localitiesByDepartment()}
        initial={petFormValuesOf(pet)}
        accountId={profile.id}
        returnTo={path}
        editing={{
          petId: pet.id,
          photos: pet.photos.map(publishedSlot),
          ageBase: pet.ageBase,
          ageShown: pet.age,
        }}
      />
    </PageShell>
  )
}
