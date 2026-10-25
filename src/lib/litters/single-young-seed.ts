import type { PetFormValues } from '@/lib/pets/types'
import type { LitterFormValues, YoungFormValues } from './types'

// «Publicarla como un animal» con lo que ya se cargó (FR-012): lo propio de la cría primero y lo
// común de respaldo, fotos incluidas. La fecha de entrega no pasa: un animal no la tiene.
export function singleYoungSeed<P>(
  litter: LitterFormValues,
  young: YoungFormValues,
  photos: { litter: readonly P[]; young: readonly P[] },
): { values: PetFormValues; photos: P[] } {
  const { deliversFrom: _deliversFrom, young: _young, ...common } = litter
  return {
    values: {
      ...common,
      name: young.name,
      sex: young.sex,
      description: young.description.trim() === '' ? litter.description : young.description,
    },
    photos: [...(photos.young.length > 0 ? photos.young : photos.litter)],
  }
}
