import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { handedOverNotice } from '@/components/adoptions/handover-line-texts'
import { followUpLines } from '@/components/follow-ups/follow-up-lines'
import { litterStatusTexts } from '@/components/litters/litter-status-texts'
import { LitterYoungItems } from '@/components/litters/litter-young-items'
import { MyLitterPanel } from '@/components/litters/my-litter-panel'
import { expiryLine } from '@/components/pets/expiry-texts'
import { PetNotFound } from '@/components/pets/pet-not-found'
import { shareTexts } from '@/components/pets/share-texts'
import { takedownText } from '@/components/pets/takedown-texts'
import { ToastProvider } from '@/components/ui/toast'
import { HANDED_OVER_FLAG } from '@/lib/adoptions/paths'
import { requireProfile } from '@/lib/auth/require-profile'
import { openApplicationsOf } from '@/lib/litters/open-applications'
import { litterEditPath, litterPanelPath } from '@/lib/litters/paths'
import { cardView, litterCardTexts, stampOf } from '@/lib/pets/listed-card-view'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { getMyPetAdoptions } from '@/lib/supabase/queries/adoptions'
import { getPublisherNewCounts } from '@/lib/supabase/queries/application-responses'
import { myPetFollowUps } from '@/lib/supabase/queries/follow-ups'
import { countOpenApplicationsByYoung, getMyLitter } from '@/lib/supabase/queries/litters'
import { verifyPath } from '@/lib/verification/gate'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'

type Props = {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ [HANDED_OVER_FLAG]?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('litters.panel')
  return { title: t('meta_title'), robots: { index: false, follow: false } }
}

// Una ajena o que no existe es el mismo «Esta camada no existe», dibujado acá como el de un animal.
export default async function MyLitterPage({ params, searchParams }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const path = litterPanelPath(id)
  await requireProfile(path)

  const [litter, missing, toast] = await Promise.all([
    getMyLitter(id),
    getTranslations('litters.not_found'),
    getTranslations('common.toast'),
  ])
  if (litter === null) {
    return (
      <PageShell width="full">
        <PetNotFound
          texts={{ title: missing('title'), body: missing('body'), action: missing('action') }}
        />
      </PageShell>
    )
  }

  const now = new Date()
  // Quitar una cría y borrar la camada dicen antes cuántas solicitudes se cierran (FR-033, FR-035).
  const [
    panel,
    page,
    status,
    card,
    myPets,
    share,
    takedown,
    expiry,
    inbox,
    adoptions,
    followUps,
    query,
    openApplications,
  ] = await Promise.all([
    getTranslations('litters.panel'),
    getTranslations('litters.page'),
    getTranslations('pets.status'),
    getTranslations('litters.card'),
    getTranslations('pets.my_pets'),
    shareTexts(litter.name),
    takedownText({ sex: 'female', takedown: litter.takedown }),
    expiryLine(litter, now),
    getPublisherNewCounts(),
    getMyPetAdoptions(),
    myPetFollowUps(),
    searchParams,
    countOpenApplicationsByYoung([litter]),
  ])
  const statusTexts = await litterStatusTexts(litter, {
    openApplications: openApplicationsOf(litter.young, openApplications),
    adoptions,
  })
  const gateHref = verifyPath({ reason: 'publish', next: path, from: MY_PETS_PATH })
  const available = litter.young.filter((one) => one.state === 'available').length
  const photo = cardView(
    { ...litter, key: litter.id, href: litterEditPath(litter.id) },
    {
      ...litterCardTexts(litter, card, myPets),
      stamp: stampOf({ state: litter.state, sex: 'female' }, status),
    },
  )
  const handedOver = litter.young.find(
    (one) => one.id === query[HANDED_OVER_FLAG] && one.state === 'adopted',
  )

  return (
    <PageShell width="full">
      {handedOver === undefined ? null : (
        <ScreenToast message={await handedOverNotice(handedOver, adoptions.get(handedOver.id))} />
      )}
      <ToastProvider label={toast('label')} regionLabel={toast('region')}>
        <MyLitterPanel
          litter={litter}
          returnPath={path}
          gateHref={gateHref}
          photo={photo}
          texts={{
            back: panel('back'),
            count: page('count', { young: litter.young.length, available }),
            seeLitter: panel('see_litter'),
            edit: panel('edit'),
            share,
            takedown,
            expiry,
            youngTitle: panel('young_title'),
            status: statusTexts,
          }}
        >
          <LitterYoungItems
            litter={litter}
            layout="panel"
            returnPath={path}
            gateHref={gateHref}
            inbox={inbox}
            adoptions={adoptions}
            followUps={await followUpLines(litter.young, followUps)}
            openApplications={openApplications}
          />
        </MyLitterPanel>
      </ToastProvider>
    </PageShell>
  )
}
