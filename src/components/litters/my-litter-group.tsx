import { getTranslations } from 'next-intl/server'
import { shareTexts } from '@/components/pets/share-texts'
import { takedownText } from '@/components/pets/takedown-texts'
import { handoverPath } from '@/lib/adoptions/paths'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import { inboxLinkOf } from '@/lib/applications/inbox-link'
import { litterPanelPath } from '@/lib/litters/paths'
import type { MyLitter } from '@/lib/litters/types'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { MyLitterActions } from './my-litter-actions'
import { YoungRow } from './young-row'
import { youngRowTexts } from './young-row-texts'
import { YoungRows } from './young-rows'
import { YoungStatusActions } from './young-status-actions'

type Props = {
  litter: MyLitter
  /** Cuántas solicitudes tiene cada cría y cuántas son nuevas, por id (#65). */
  inbox: ReadonlyMap<string, { fresh: number; total: number }>
  /** A quién se entregó cada adoptada, por id (#67). */
  adoptions: ReadonlyMap<string, PetAdoptionSummary>
  /** El seguimiento de cada adoptada, por id (#69). */
  followUps?: ReadonlyMap<string, React.ReactNode>
  gateHref: string
}

// Lo que va debajo de una camada en la pared de «Mis animales» (historia #206, research R9): el
// recuento, una fila por cría con su sello y sus acciones, el camino a su panel, y «Ver ficha» y
// «Compartir» de la camada.
export async function MyLitterGroup({ litter, inbox, adoptions, followUps, gateHref }: Props) {
  const [mine, page, panel, pets, inboxTexts, share, takedown, rows] = await Promise.all([
    getTranslations('litters.my'),
    getTranslations('litters.page'),
    getTranslations('litters.panel'),
    getTranslations('pets.page'),
    getTranslations('inbox.my_pets'),
    shareTexts(litter.name),
    // «Camada» es femenino: «Dada de baja: …» (#205, FR-044).
    takedownText({ sex: 'female', takedown: litter.takedown }),
    Promise.all(litter.young.map((one) => youngRowTexts(one, adoptions.get(one.id)))),
  ])
  const available = litter.young.filter((one) => one.state === 'available').length

  return (
    <div className="flex flex-col gap-3">
      <YoungRows
        count={page('count', { young: litter.young.length, available })}
        panel={{ href: litterPanelPath(litter.id), label: panel('open') }}
      >
        {litter.young.map((one, index) => {
          const texts = rows[index]
          return texts === undefined ? null : (
            <YoungRow
              key={one.id}
              line={mine('young_line', { name: one.name, sex: one.sex })}
              stamp={texts.stamp}
              inbox={inboxLinkOf(one.id, inbox.get(one.id), {
                fresh: (count) => inboxTexts('fresh', { count }),
                all: inboxTexts('all'),
              })}
              handover={texts.handover}
              followUp={followUps?.get(one.id)}
              actions={
                <YoungStatusActions
                  petId={one.id}
                  state={one.state}
                  litterState={litter.state}
                  layout="sheet"
                  returnPath={MY_PETS_PATH}
                  handoverHref={handoverPath(one.id, MY_PETS_PATH)}
                  gateHref={gateHref}
                  texts={texts.actions}
                />
              }
            />
          )
        })}
      </YoungRows>
      <MyLitterActions litter={litter} texts={{ seeLitter: pets('see_pet'), share, takedown }} />
    </div>
  )
}
