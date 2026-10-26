import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { handedOverNotice } from '@/components/adoptions/handover-line-texts'
import { FollowUpLine } from '@/components/follow-ups/follow-up-line'
import { followUpLineTexts } from '@/components/follow-ups/follow-up-line-texts'
import { MyLitterPanel } from '@/components/litters/my-litter-panel'
import { YoungPanelRow } from '@/components/litters/young-panel-row'
import { YoungStatusActions } from '@/components/litters/young-status-actions'
import { youngRowTexts } from '@/components/litters/young-row-texts'
import { expiryLine } from '@/components/pets/expiry-texts'
import { PetNotFound } from '@/components/pets/pet-not-found'
import { shareTexts } from '@/components/pets/share-texts'
import { takedownText } from '@/components/pets/takedown-texts'
import { ToastProvider } from '@/components/ui/toast'
import { HANDED_OVER_FLAG, handoverPath } from '@/lib/adoptions/paths'
import { inboxLinkOf } from '@/lib/applications/inbox-link'
import { requireProfile } from '@/lib/auth/require-profile'
import { litterEditPath, litterPanelPath } from '@/lib/litters/paths'
import type { LitterYoung } from '@/lib/litters/types'
import { cardView, litterCardTexts, stampOf } from '@/lib/pets/listed-card-view'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { getMyPetAdoptions } from '@/lib/supabase/queries/adoptions'
import { getPublisherNewCounts } from '@/lib/supabase/queries/application-responses'
import { myPetFollowUps } from '@/lib/supabase/queries/follow-ups'
import { getMyLitter } from '@/lib/supabase/queries/litters'
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

// La camada en «Mis animales» (historia #206, contracts §Rutas): pide entrar y vuelve acá. Una ajena
// o que no existe es el mismo «Esta camada no existe», dibujado acá como el de un animal. Cada cría
// con su sello, sus solicitudes nuevas, sus acciones y, adoptada, a quién se dio y su seguimiento.
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
  const [panel, page, status, card, myPets, inboxTexts, share, takedown, expiry, inbox] =
    await Promise.all([
      getTranslations('litters.panel'),
      getTranslations('litters.page'),
      getTranslations('pets.status'),
      getTranslations('litters.card'),
      getTranslations('pets.my_pets'),
      getTranslations('inbox.my_pets'),
      shareTexts(litter.name),
      takedownText({ sex: 'female', takedown: litter.takedown }),
      expiryLine(litter, now),
      getPublisherNewCounts(),
    ])
  const [adoptions, followUps, query] = await Promise.all([
    getMyPetAdoptions(),
    myPetFollowUps(),
    searchParams,
  ])
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

  const rows = await Promise.all(
    litter.young.map(async (one: LitterYoung) => {
      const followUp = followUps.get(one.id)
      const [texts, followUpTexts] = await Promise.all([
        youngRowTexts(one, adoptions.get(one.id)),
        one.state === 'adopted' && followUp?.adoptionCurrent === true
          ? followUpLineTexts(followUp)
          : null,
      ])
      return (
        <YoungPanelRow
          key={one.id}
          name={one.name}
          sex={page('young_sex', { sex: one.sex })}
          stamp={texts.stamp}
          inbox={inboxLinkOf(one.id, inbox.get(one.id), {
            fresh: (count) => inboxTexts('fresh', { count }),
            all: inboxTexts('all'),
          })}
          handover={texts.handover}
          followUp={followUpTexts === null ? null : <FollowUpLine texts={followUpTexts} />}
          actions={
            <YoungStatusActions
              petId={one.id}
              state={one.state}
              litterState={litter.state}
              layout="row"
              returnPath={path}
              handoverHref={handoverPath(one.id, path)}
              gateHref={gateHref}
              texts={texts.actions}
            />
          }
        />
      )
    }),
  )

  return (
    <PageShell width="full">
      {handedOver === undefined ? null : (
        <ScreenToast message={await handedOverNotice(handedOver, adoptions.get(handedOver.id))} />
      )}
      <ToastProvider label={toast('label')} regionLabel={toast('region')}>
        <MyLitterPanel
          litter={litter}
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
          }}
        >
          {rows}
        </MyLitterPanel>
      </ToastProvider>
    </PageShell>
  )
}
