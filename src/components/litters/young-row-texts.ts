import { getTranslations } from 'next-intl/server'
import { handoverLineTexts } from '@/components/adoptions/handover-line-texts'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import type { LitterYoung } from '@/lib/litters/types'
import { youngStatusTexts } from './young-status-texts'

// Lo que dice una cría en su fila de «Mis animales» y en el panel de su camada, armado en el
// servidor: su sello en femenino (FR-045), a quién se entregó si está adoptada y sus acciones.
export async function youngRowTexts(young: LitterYoung, adoption: PetAdoptionSummary | undefined) {
  const adopted = young.state === 'adopted'
  const [status, actions, handover] = await Promise.all([
    getTranslations('pets.status'),
    youngStatusTexts(young, adopted ? adoption : undefined),
    adopted ? handoverLineTexts(adoption, young.sex) : null,
  ])
  const stamp =
    young.state === 'available'
      ? null
      : { state: young.state, label: status('stamp', { state: young.state, sex: 'female' }) }
  return { stamp, actions, handover }
}
