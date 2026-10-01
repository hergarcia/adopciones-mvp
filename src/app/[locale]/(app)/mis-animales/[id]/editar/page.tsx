import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { requireVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { petFormValuesOf } from '@/lib/pets/form-data'
import { editPetPath, myPetPath, petGateRequest } from '@/lib/pets/paths'
import { publishedSlot } from '@/lib/pets/photo-source'
import { getMyPet } from '@/lib/supabase/queries/pets'
import { PetFormScreen } from '@/app/[locale]/_components/pet-form-screen'

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
  const [pet, t] = await Promise.all([getMyPet(id), getTranslations('pets.form')])
  if (pet === null) notFound()
  // Una dada de baja no se edita (FR-006): su pantalla dice por qué y deja borrarla.
  if (pet.state === 'taken_down') redirect(myPetPath(pet.id))

  return (
    <PetFormScreen
      title={t('edit_title', { name: pet.name })}
      mode="edit"
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
  )
}
