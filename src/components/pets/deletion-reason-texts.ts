import { getTranslations } from 'next-intl/server'
import type { DeletionReason } from '@/lib/pets/deletion-reason'
import type { Sex } from '@/lib/pets/options'
import type { ConfirmShape } from '@/components/forms/confirm-skeleton'

export type DeletionReasonTexts = {
  title: string
  hint: string
  options: Record<DeletionReason, string>
}

/** La espera de «¿Por qué lo borrás?» con sus casillas; sin la pregunta, solo los botones. */
export function deletionShape(reason: DeletionReasonTexts | null): ConfirmShape {
  return reason === null
    ? {}
    : { legend: true, hint: true, options: Object.keys(reason.options).length }
}

/** «¿Por qué lo borrás?» concordada: una camada pasa `female`, como «la camada». */
export async function deletionReasonTexts(sex: Sex): Promise<DeletionReasonTexts> {
  const t = await getTranslations('pets.deletion_reason')
  return {
    title: t('title', { sex }),
    hint: t('hint'),
    options: {
      no_applications: t('options.no_applications'),
      unconvincing_applications: t('options.unconvincing_applications'),
      given_elsewhere: t('options.given_elsewhere', { sex }),
      not_for_adoption: t('options.not_for_adoption'),
      other: t('options.other'),
    },
  }
}
