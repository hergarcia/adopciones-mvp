import { getTranslations } from 'next-intl/server'
import { handoverLineTexts } from '@/components/adoptions/handover-line-texts'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import type { LitterState, LitterYoung } from '@/lib/litters/types'
import { removeYoungTexts } from './remove-young-texts'
import { youngStatusTexts } from './young-status-texts'

// Lo que dice una cría en su fila de «Mis animales» y en el panel de su camada, armado en el
// servidor: su sello en femenino (FR-045), a quién se entregó si está adoptada, sus acciones y la
// confirmación de quitarla, que con la camada dada de baja no está: ahí solo se borra la camada
// (spec, Edge Cases).
export async function youngRowTexts(
  young: LitterYoung,
  adoption: PetAdoptionSummary | undefined,
  removal: { litterState: LitterState; openApplications: number; isLast: boolean },
) {
  const adopted = young.state === 'adopted'
  const [status, actions, handover, remove] = await Promise.all([
    getTranslations('pets.status'),
    youngStatusTexts(young, adopted ? adoption : undefined),
    adopted ? handoverLineTexts(adoption, young.sex) : null,
    removal.litterState === 'taken_down' ? null : removeYoungTexts(young, removal),
  ])
  const stamp =
    young.state === 'available'
      ? null
      : { state: young.state, label: status('stamp', { state: young.state, sex: 'female' }) }
  return { stamp, actions, handover, remove }
}
