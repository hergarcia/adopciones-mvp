import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { HandoverCandidate } from '@/components/adoptions/handover-candidate'
import { HandoverForm } from '@/components/adoptions/handover-form'
import { ApplicationPetLayout } from '@/components/applications/application-pet-layout'
import { LinkButton } from '@/components/ui/link-button'
import { handoverPath, handoverReturnPath } from '@/lib/adoptions/paths'
import { petInboxPath } from '@/lib/applications/paths'
import { requireProfile } from '@/lib/auth/require-profile'
import { youngLabel } from '@/lib/litters/litter-words'
import { litterPanelPath } from '@/lib/litters/paths'
import { MY_PETS_PATH, myPetPath } from '@/lib/pets/paths'
import type { PetPhotoData } from '@/lib/pets/types'
import { getHandoverPet, listHandoverCandidates } from '@/lib/supabase/queries/adoptions'
import { getMyLitter } from '@/lib/supabase/queries/litters'
import { getMyPetSummary } from '@/lib/supabase/queries/pets'
import {
  handoverCandidateTexts,
  handoverChoiceTexts,
} from '@/app/[locale]/_components/handover-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ volver?: string }>
}

const CAN_HAND_OVER = new Set(['available', 'in_process', 'paused', 'expired'])

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.handover')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// «¿A quién se lo diste?» (research R8): una pantalla, no una hoja, porque las aceptadas son un
// dato que se trae, con su cargando y su error. Alrededor del animal que se entrega, como las
// pantallas de una solicitud: la foto pegada y la pregunta al lado. Ajeno o inexistente, no existe; en un estado que no
// se marca —ya adoptado, dado de baja—, la pantalla del animal muestra cómo quedó (US1-AS10). Una
// cría se nombra con su camada, también en el compromiso, y su pantalla es el panel de la camada
// (historia #206, FR-028).
async function coverOf(petId: string, litterId: string | null): Promise<PetPhotoData | null> {
  if (litterId === null) return (await getMyPetSummary(petId))?.cover ?? null
  return (await getMyLitter(litterId))?.cover ?? null
}

export default async function HandoverPage({ params, searchParams }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const back = handoverReturnPath(id, (await searchParams).volver)
  const self = handoverPath(id, back)
  await requireProfile(self)

  // Las aceptadas de un animal ajeno son cero filas: se piden a la vez que el animal.
  const [pet, candidates, t, commitment, litters] = await Promise.all([
    getHandoverPet(id),
    listHandoverCandidates(id),
    getTranslations('adoptions.handover'),
    getTranslations('adoptions.commitment'),
    getTranslations('litters'),
  ])
  if (pet === null) notFound()
  const petScreen = pet.litter === null ? myPetPath(id) : litterPanelPath(pet.litter.id)
  if (!CAN_HAND_OVER.has(pet.state)) redirect(petScreen)
  const cover = await coverOf(id, pet.litter?.id ?? null)
  const named = {
    ...pet,
    name: litters(
      'young_label',
      youngLabel({ name: pet.name, litterName: pet.litter?.name ?? null }),
    ),
  }
  const values = { name: named.name, sex: pet.sex }
  const backLabel =
    back === MY_PETS_PATH
      ? t('back_my_pets')
      : t('back_pet', {
          name: back === petScreen && pet.litter !== null ? pet.litter.name : pet.name,
        })
  const outsideConfirm = t('confirm_outside', values)
  const options = await Promise.all(
    candidates.map(async (candidate) => ({
      applicationId: candidate.applicationId,
      label: (
        <HandoverCandidate
          avatar={candidate.avatar}
          level={candidate.level}
          texts={await handoverCandidateTexts(candidate)}
        />
      ),
      texts: await handoverChoiceTexts(named, candidate.name),
    })),
  )

  return (
    <PageShell width="full">
      <ApplicationPetLayout
        cover={cover}
        photoAlt={t('photo_alt', { person: pet.name })}
        head={
          <div className="flex flex-col items-start gap-4">
            <LinkButton href={back} variant="ghost" size="sm">
              {backLabel}
            </LinkButton>
            <h1 className="afiche text-2xl break-words text-ink">
              {t(candidates.length > 0 ? 'title' : 'title_outside', values)}
            </h1>
          </div>
        }
      >
        <HandoverForm
          petId={id}
          back={back}
          self={self}
          petScreen={petScreen}
          options={options}
          texts={{
            legend: t('intro', values),
            outside: t('outside', values),
            outsideNote: t('outside_note'),
            commitmentTitle: commitment('title'),
            outsideConfirm,
            outsideFailures: {
              offline: t('errors.offline', { action: outsideConfirm }),
              no_response: t('errors.failed', { action: outsideConfirm }),
            },
            cancel: t('cancel'),
            empty:
              candidates.length > 0
                ? null
                : {
                    lead: t('outside_only', values),
                    note: t('empty_note', values),
                    link: t('empty_link', values),
                    href: petInboxPath(id),
                  },
          }}
        />
      </ApplicationPetLayout>
    </PageShell>
  )
}
