import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { MyPetsGrid } from '@/components/pets/my-pets-grid'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { requireProfile } from '@/lib/auth/require-profile'
import { MY_PETS_PATH, PUBLISH_PATH } from '@/lib/pets/paths'
import { listMyPets } from '@/lib/supabase/queries/pets'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { PetSavedNotice } from '@/app/[locale]/(app)/_components/pet-saved-notice'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ guardado?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pets.metadata.my_pets')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Con o sin nivel 1: quien lo perdió sigue viendo lo que publicó (FR-004).
export default async function MyPetsPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireProfile(MY_PETS_PATH)

  const [t, pets] = await Promise.all([getTranslations('pets.my_pets'), listMyPets()])
  const publish = (
    <LinkButton href={PUBLISH_PATH} variant="tirita" size="lg" className="md:w-auto">
      {t('publish')}
    </LinkButton>
  )

  return (
    <PageShell width="full">
      <PetSavedNotice flag={(await searchParams).guardado} />
      <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
      {pets.length === 0 ? (
        <EmptyState title={t('empty')} action={publish} className="mt-6" />
      ) : (
        <>
          <div className="mt-6">{publish}</div>
          <div className="mt-8">
            <MyPetsGrid pets={pets} />
          </div>
        </>
      )}
    </PageShell>
  )
}
