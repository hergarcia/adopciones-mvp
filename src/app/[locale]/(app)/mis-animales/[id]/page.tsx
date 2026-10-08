import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { handedOverNotice, handoverLineTexts } from '@/components/adoptions/handover-line-texts'
import { expiryLine } from '@/components/pets/expiry-texts'
import { MyPetPanel } from '@/components/pets/my-pet-panel'
import { PetNotFound } from '@/components/pets/pet-not-found'
import { shareTexts } from '@/components/pets/share-texts'
import { petStatusTexts } from '@/components/pets/status-texts'
import { takedownText } from '@/components/pets/takedown-texts'
import { ToastProvider } from '@/components/ui/toast'
import { requireProfile } from '@/lib/auth/require-profile'
import { cardTexts, cardView, stampOf } from '@/lib/pets/listed-card-view'
import { HANDED_OVER_FLAG } from '@/lib/adoptions/paths'
import { MY_PETS_PATH, editPetPath, myPetPath } from '@/lib/pets/paths'
import { getMyPetAdoptions } from '@/lib/supabase/queries/adoptions'
import { getMyPetSummary } from '@/lib/supabase/queries/pets'
import { verifyPath } from '@/lib/verification/gate'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'

type Props = {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ [HANDED_OVER_FLAG]?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pets.metadata.my_pet')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Un animal en «Mis animales» (research R6): pide entrar y vuelve acá. Uno ajeno o que no existe es
// el mismo «Este animal no existe» (FR-002), dibujado acá y no con `notFound()`, como la ficha.
export default async function MyPetPage({ params, searchParams }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const path = myPetPath(id)
  await requireProfile(path)

  const [pet, missing, toast] = await Promise.all([
    getMyPetSummary(id),
    getTranslations('pets.not_found'),
    getTranslations('common.toast'),
  ])
  if (pet === null) {
    return (
      <PageShell width="full">
        <PetNotFound
          texts={{ title: missing('title'), body: missing('body'), action: missing('action') }}
        />
      </PageShell>
    )
  }

  const [t, page, status, share, statusTexts, takedown, expiry, adoptions, query] =
    await Promise.all([
      getTranslations('pets.my_pets'),
      getTranslations('pets.status.my_pet'),
      getTranslations('pets.status'),
      shareTexts(pet.name),
      petStatusTexts(pet),
      takedownText(pet),
      expiryLine(pet, new Date()),
      getMyPetAdoptions(),
      searchParams,
    ])
  const adopted = pet.state === 'adopted'
  const adoption = adoptions.get(pet.id)
  // La foto, su `alt` y su sello, armados como los de la card de la pared.
  const photo = cardView(
    { ...pet, key: pet.id, href: editPetPath(pet.id) },
    { ...cardTexts(pet, t), stamp: stampOf(pet, status) },
  )

  return (
    <PageShell width="full">
      {adopted && query[HANDED_OVER_FLAG] === pet.id ? (
        <ScreenToast message={await handedOverNotice(pet, adoption)} />
      ) : null}
      <ToastProvider label={toast('label')} regionLabel={toast('region')}>
        <MyPetPanel
          pet={pet}
          photo={photo}
          returnPath={path}
          gateHref={verifyPath({ reason: 'publish', next: path, from: MY_PETS_PATH })}
          texts={{
            back: page('back'),
            seePet: page('see_pet'),
            edit: page('edit'),
            share,
            status: statusTexts,
            takedown,
            expiry,
            handover: adopted ? await handoverLineTexts(adoption, pet.sex) : null,
          }}
        />
      </ToastProvider>
    </PageShell>
  )
}
