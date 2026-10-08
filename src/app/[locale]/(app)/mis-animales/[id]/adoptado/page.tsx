import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { HandoverCandidate } from '@/components/adoptions/handover-candidate'
import { HandoverForm } from '@/components/adoptions/handover-form'
import { LinkButton } from '@/components/ui/link-button'
import { handoverPath, handoverReturnPath } from '@/lib/adoptions/paths'
import { petInboxPath } from '@/lib/applications/paths'
import { requireProfile } from '@/lib/auth/require-profile'
import { myPetPath } from '@/lib/pets/paths'
import { getHandoverPet, listHandoverCandidates } from '@/lib/supabase/queries/adoptions'
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
// dato que se trae, con su cargando y su error. Ajeno o inexistente, no existe; en un estado que no
// se marca —ya adoptado, dado de baja—, la pantalla del animal muestra cómo quedó (US1-AS10).
export default async function HandoverPage({ params, searchParams }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const back = handoverReturnPath(id, (await searchParams).volver)
  const self = handoverPath(id, back)
  await requireProfile(self)

  // Las aceptadas de un animal ajeno son cero filas: se piden a la vez que el animal.
  const [pet, candidates, t, commitment] = await Promise.all([
    getHandoverPet(id),
    listHandoverCandidates(id),
    getTranslations('adoptions.handover'),
    getTranslations('adoptions.commitment'),
  ])
  if (pet === null) notFound()
  if (!CAN_HAND_OVER.has(pet.state)) redirect(myPetPath(id))
  const values = { name: pet.name, sex: pet.sex }
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
      texts: await handoverChoiceTexts(pet, candidate.name),
    })),
  )

  return (
    <PageShell>
      <div className="flex flex-col items-start gap-6">
        <LinkButton href={back} variant="ghost" size="sm">
          {t('back', values)}
        </LinkButton>
        <h1 className="afiche text-2xl break-words text-ink">{t('title', values)}</h1>
        <div className="w-full">
          <HandoverForm
            petId={id}
            back={back}
            self={self}
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
                      note: t('empty_note', values),
                      link: t('empty_link', values),
                      href: petInboxPath(id),
                    },
            }}
          />
        </div>
      </div>
    </PageShell>
  )
}
