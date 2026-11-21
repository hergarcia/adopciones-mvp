import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { ApplicationDetailHeader } from '@/components/applications/application-detail-header'
import { ApplicationPetLayout } from '@/components/applications/application-pet-layout'
import { SuggestedPetsSkeleton } from '@/components/pets/suggested-pets'
import { LinkButton } from '@/components/ui/link-button'
import { TextLink } from '@/components/ui/text-link'
import { heldExit } from '@/lib/applications/held-exit'
import type { LapsedHeldApplication } from '@/lib/applications/types'
import { LISTING_PATH } from '@/lib/pets/paths'
import type { DepartmentCode } from '@/lib/zones/departments'
import { lapsedHeldTexts } from '@/app/[locale]/_components/application-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { MySuggestions } from './my-suggestions'

type Props = {
  held: LapsedHeldApplication
  /** El departamento del perfil: el de los sugeridos y el del listado filtrado. */
  department: DepartmentCode
}

// Una escrita que no salió (historia #294): la cabecera de Mi solicitud y una sola salida debajo. Sin
// las respuestas, que se borraron el día en que no salió (#289). El nombre lleva a la ficha solo
// cuando esa es la salida: si no, sería un «Ver a» escondido.
export async function HeldNotSent({ held, department }: Props) {
  const [texts, t, mine] = await Promise.all([
    lapsedHeldTexts(held),
    getTranslations('applications.detail'),
    getTranslations('applications.mine'),
  ])
  const exit = heldExit(held)
  const toListing = (
    <div>
      <TextLink href={LISTING_PATH}>{mine('to_listing')}</TextLink>
    </div>
  )
  return (
    <PageShell width="full">
      <ApplicationPetLayout
        cover={held.cover}
        photoAlt={texts.photoAlt}
        wide
        head={
          <ApplicationDetailHeader
            href={exit.kind === 'pet' ? exit.href : null}
            tone="muted"
            texts={texts}
          />
        }
      >
        {exit.kind === 'pet' ? (
          <div>
            <LinkButton href={exit.href}>{t('see_pet', { name: held.petName })}</LinkButton>
          </div>
        ) : exit.kind === 'suggestions' ? (
          <Suspense fallback={<SuggestedPetsSkeleton />}>
            <MySuggestions
              source={{ kind: 'held', id: held.id }}
              department={department}
              empty={toListing}
            />
          </Suspense>
        ) : (
          toListing
        )}
      </ApplicationPetLayout>
    </PageShell>
  )
}
