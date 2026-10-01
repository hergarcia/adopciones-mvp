import { getTranslations } from 'next-intl/server'
import type { Sex } from '@/lib/pets/options'
import type { Takedown } from '@/lib/pets/types'

/** «Dada de baja: venta o pedido de plata.», o el texto de «otro» tal cual (FR-029). */
export async function takedownText(pet: { sex: Sex; takedown: Takedown | null }) {
  if (pet.takedown === null) return null
  const t = await getTranslations('pets.status.takedown')
  const reason = t(`reasons.${pet.takedown.reason}`, { note: pet.takedown.note ?? '' })
  return t('note', { sex: pet.sex, reason })
}
