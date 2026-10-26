import { getTranslations } from 'next-intl/server'
import { expiryLine } from '@/components/pets/expiry-texts'
import { shareTexts } from '@/components/pets/share-texts'
import { takedownText } from '@/components/pets/takedown-texts'
import { TextLink } from '@/components/ui/text-link'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import { litterPanelPath } from '@/lib/litters/paths'
import { openApplicationsOf } from '@/lib/litters/open-applications'
import type { MyLitter } from '@/lib/litters/types'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { LitterCountLine } from './litter-count-line'
import { litterStatusTexts } from './litter-status-texts'
import { MyLitterActions } from './my-litter-actions'

type Props = {
  litter: MyLitter
  /** A quién se entregó cada adoptada, por id: volver a publicar la camada lo dice (#67). */
  adoptions: ReadonlyMap<string, PetAdoptionSummary>
  gateHref: string
  /** Cuántas solicitudes abiertas tiene cada cría, por id: borrar la camada dice cuántas cierra. */
  openApplications: ReadonlyMap<string, number>
}

// Arriba de sus crías, en la banda de la camada: lo que vale para la camada entera.
export async function MyLitterGroup({ litter, adoptions, gateHref, openApplications }: Props) {
  const [page, panel, pets, share, takedown, expiry, status] = await Promise.all([
    getTranslations('litters.page'),
    getTranslations('litters.panel'),
    getTranslations('pets.page'),
    shareTexts(litter.name),
    // «Camada» es femenino: «Dada de baja: …».
    takedownText({ sex: 'female', takedown: litter.takedown }),
    expiryLine(litter, new Date()),
    litterStatusTexts(litter, {
      openApplications: openApplicationsOf(litter.young, openApplications),
      adoptions,
    }),
  ])
  const available = litter.young.filter((one) => one.state === 'available').length

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="px-1">
        <LitterCountLine
          text={page('count', { young: litter.young.length, available })}
          size="base"
        />
      </div>
      <MyLitterActions
        litter={litter}
        returnPath={MY_PETS_PATH}
        gateHref={gateHref}
        texts={{ seeLitter: pets('see_pet'), share, takedown, expiry, status }}
      />
      <div className="px-1">
        <TextLink href={litterPanelPath(litter.id)} weight="medium">
          {panel('open')}
        </TextLink>
      </div>
    </div>
  )
}
