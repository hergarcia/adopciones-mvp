import { getFormatter, getTranslations } from 'next-intl/server'
import { expiryView } from '@/lib/pets/lifecycle'
import type { PetState } from '@/lib/pets/types'
import type { ExpiryLine } from './pet-expiry-line'

/** «Vence el 5 de octubre», «Vence pronto: …» o «Venció el …»; pausada, adoptada o dada de baja, nada. */
export async function expiryLine(
  pet: { state: PetState; expiresAt: Date | null },
  now: Date,
): Promise<ExpiryLine | null> {
  const view = expiryView(pet.state, pet.expiresAt, now)
  if (view === null || pet.expiresAt === null) return null
  const [t, format] = await Promise.all([getTranslations('pets.status.expiry'), getFormatter()])
  const date = format.dateTime(pet.expiresAt, { day: 'numeric', month: 'long' })
  if (view.kind === 'expired') return { text: t('expired', { date }), soon: false }
  return { text: t(view.soon ? 'soon' : 'expires', { date }), soon: view.soon }
}
