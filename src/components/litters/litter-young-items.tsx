import { getTranslations } from 'next-intl/server'
import { handoverPath } from '@/lib/adoptions/paths'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import { inboxLinkOf } from '@/lib/applications/inbox-link'
import type { MyLitter } from '@/lib/litters/types'
import { RemoveYoungAction } from './remove-young-action'
import { YoungPanelRow } from './young-panel-row'
import { YoungRow } from './young-row'
import { youngRowTexts } from './young-row-texts'
import { YoungStatusActions } from './young-status-actions'

type Props = {
  litter: Pick<MyLitter, 'state' | 'young'>
  /** `wall`, una `YoungRow` con sus acciones en una hoja; `panel`, una `YoungPanelRow` a la vista. */
  layout: 'wall' | 'panel'
  returnPath: string
  gateHref: string
  /** Cuántas solicitudes tiene cada cría y cuántas son nuevas, por id (#65). */
  inbox: ReadonlyMap<string, { fresh: number; total: number }>
  /** A quién se entregó cada adoptada, por id (#67). */
  adoptions: ReadonlyMap<string, PetAdoptionSummary>
  /** El seguimiento de cada adoptada, ya dibujado, por id (#69). */
  followUps?: ReadonlyMap<string, React.ReactNode>
  /** Cuántas solicitudes abiertas cierra quitar cada cría, por id. */
  openApplications: ReadonlyMap<string, number>
}

export async function LitterYoungItems({
  litter,
  layout,
  returnPath,
  gateHref,
  inbox,
  adoptions,
  followUps,
  openApplications,
}: Props) {
  const [mine, page, inboxTexts, rows] = await Promise.all([
    getTranslations('litters.my'),
    getTranslations('litters.page'),
    getTranslations('inbox.my_pets'),
    Promise.all(
      litter.young.map((one) =>
        youngRowTexts(one, adoptions.get(one.id), {
          litterState: litter.state,
          openApplications: openApplications.get(one.id) ?? 0,
          isLast: litter.young.length === 1,
        }),
      ),
    ),
  ])

  return litter.young.map((one, index) => {
    const texts = rows[index]
    if (texts === undefined) return null
    const details = {
      stamp: texts.stamp,
      handover: texts.handover,
      followUp: followUps?.get(one.id),
      inbox: inboxLinkOf(one.id, inbox.get(one.id), {
        fresh: (count) => inboxTexts('fresh', { count }),
        all: inboxTexts('all'),
      }),
    }
    const actions = (
      <YoungStatusActions
        petId={one.id}
        state={one.state}
        litterState={litter.state}
        layout={layout === 'wall' ? 'sheet' : 'row'}
        returnPath={returnPath}
        handoverHref={handoverPath(one.id, returnPath)}
        gateHref={gateHref}
        texts={texts.actions}
        remove={
          texts.remove === null ? null : (
            <RemoveYoungAction petId={one.id} returnPath={returnPath} texts={texts.remove} />
          )
        }
      />
    )
    return layout === 'wall' ? (
      <YoungRow
        key={one.id}
        line={mine('young_line', { name: one.name, sex: one.sex })}
        actions={actions}
        {...details}
      />
    ) : (
      <YoungPanelRow
        key={one.id}
        name={one.name}
        sex={page('young_sex', { sex: one.sex })}
        actions={actions}
        {...details}
      />
    )
  })
}
