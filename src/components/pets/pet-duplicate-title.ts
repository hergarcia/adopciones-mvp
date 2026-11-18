import type { Duplicate } from '@/hooks/use-pet-feedback'
import type { PetDialogTexts } from './pet-form-types'

/** «Ya tenés una perra llamada Luna», con la especie y el sexo del que ya existe. */
export function petDuplicateTitle(
  texts: PetDialogTexts,
  duplicate: Duplicate | null,
): string | null {
  if (duplicate === null) return null
  return (texts.duplicate[`${duplicate.species}_${duplicate.sex}`] ?? '').replace(
    '{name}',
    duplicate.name.trim(),
  )
}
