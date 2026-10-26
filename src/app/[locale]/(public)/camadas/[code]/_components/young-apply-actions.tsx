import { getTranslations } from 'next-intl/server'
import { ApplyAction } from '@/components/applications/apply-action'
import { applyActionKind } from '@/lib/applications/apply-action'
import { applyYoungPath, myApplicationPath } from '@/lib/applications/paths'
import type { PublicLitter } from '@/lib/litters/types'
import { LISTING_PATH } from '@/lib/pets/paths'

// El botón de cada cría, con la misma regla que la ficha de un animal (FR-031): «Quiero adoptar»,
// también en proceso, «Ver mi solicitud» o que no fue aceptada; nada para quien la publicó ni en una
// adoptada (#206, FR-018). El enlace lleva el código de
// la camada, la vuelta si la cría se quita mientras tanto (FR-032).
export async function youngApplyActions(litter: PublicLitter): Promise<React.ReactNode[]> {
  const [t, pets] = await Promise.all([
    getTranslations('applications.ficha'),
    getTranslations('pets.page'),
  ])
  const texts = {
    apply: t('apply'),
    viewMine: t('view_mine'),
    rejected: t('rejected'),
    toListing: pets('to_listing'),
  }
  return litter.young.map((young) => {
    const kind = applyActionKind({
      isOwner: litter.isOwner,
      state: young.state,
      myActiveId: young.myActiveId,
      myRejected: young.myRejected,
    })
    const href =
      kind === 'rejected'
        ? LISTING_PATH
        : young.myActiveId === null
          ? applyYoungPath(young.code, litter.code)
          : myApplicationPath(young.myActiveId)
    return <ApplyAction key={young.code} kind={kind} href={href} texts={texts} look="young" />
  })
}
