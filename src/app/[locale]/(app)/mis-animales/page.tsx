import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { handedOverNotice } from '@/components/adoptions/handover-line-texts'
import { HiddenFromPublicNotice } from '@/components/pets/hidden-from-public-notice'
import { MyPetsGrid } from '@/components/pets/my-pets-grid'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { ToastProvider } from '@/components/ui/toast'
import { requireProfile } from '@/lib/auth/require-profile'
import { MY_PETS_PATH, PUBLISH_PATH } from '@/lib/pets/paths'
import { HANDED_OVER_FLAG } from '@/lib/adoptions/paths'
import { getMyPetAdoptions } from '@/lib/supabase/queries/adoptions'
import { getPublisherNewCounts } from '@/lib/supabase/queries/application-responses'
import { listMyPets } from '@/lib/supabase/queries/pets'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { verifyPath } from '@/lib/verification/gate'
import { isLevelOne, phoneStatus } from '@/lib/verification/phone-status'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'
import { PetSavedNotice } from '@/app/[locale]/(app)/_components/pet-saved-notice'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ guardado?: string; [HANDED_OVER_FLAG]?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pets.metadata.my_pets')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Con o sin nivel 1: quien lo perdió sigue viendo lo que publicó (FR-004 de la #53), con el aviso de
// que hoy nadie más lo ve (FR-020 de la #57). Sin animales, la pantalla
// no tiene otra cosa que decir: el título va centrado sobre el vacío, como en su `ErrorScreen`.
export default async function MyPetsPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireProfile(MY_PETS_PATH)

  const [t, page, toast, pets, phone, inbox, adoptions, query] = await Promise.all([
    getTranslations('pets.my_pets'),
    getTranslations('pets.page'),
    getTranslations('common.toast'),
    listMyPets(),
    getMyPhone(),
    getPublisherNewCounts(),
    getMyPetAdoptions(),
    searchParams,
  ])
  // Recién marcado adoptado desde «¿A quién se lo diste?»: el aviso de cómo quedó (historia #67).
  const handedOver = pets.find(
    (pet) => pet.id === query[HANDED_OVER_FLAG] && pet.state === 'adopted',
  )
  // Sin nivel 1 sus animales no se ven: el aviso dice por qué y lleva a confirmar (FR-020).
  const hidden = !isLevelOne(phoneStatus(phone, new Date()))
  const publish = (
    <LinkButton href={PUBLISH_PATH} variant="tirita" size="lg" className="md:w-auto">
      {t('publish')}
    </LinkButton>
  )

  return (
    <PageShell width="full">
      <PetSavedNotice flag={query.guardado} />
      {handedOver === undefined ? null : (
        <ScreenToast message={await handedOverNotice(handedOver, adoptions.get(handedOver.id))} />
      )}
      {pets.length === 0 ? (
        <HeadedEmptyState title={t('title')} body={t('empty')} action={publish} />
      ) : (
        <>
          <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
          {hidden ? (
            <div className="mt-6">
              <HiddenFromPublicNotice
                href={verifyPath({ reason: 'publish', next: MY_PETS_PATH, from: MY_PETS_PATH })}
                texts={{
                  stamp: page('list_hidden_stamp'),
                  body: page('list_hidden_body'),
                  action: page('confirm_phone'),
                }}
              />
            </div>
          ) : null}
          <div className="mt-6">{publish}</div>
          <div className="mt-8">
            {/* Un solo proveedor para los «Enlace copiado» de todos los «Compartir». */}
            <ToastProvider label={toast('label')} regionLabel={toast('region')}>
              <MyPetsGrid pets={pets} inbox={inbox} adoptions={adoptions} />
            </ToastProvider>
          </div>
        </>
      )}
    </PageShell>
  )
}
