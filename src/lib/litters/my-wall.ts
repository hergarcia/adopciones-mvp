import type { PetSummary } from '@/lib/pets/types'
import type { MyLitter } from './types'

export type MyWallEntry = { kind: 'pet'; pet: PetSummary } | { kind: 'litter'; litter: MyLitter }

const publishedAt = (entry: MyWallEntry) =>
  (entry.kind === 'pet' ? entry.pet.publishedAt : entry.litter.publishedAt).getTime()

// «Mis animales» mezcla los animales sueltos y las camadas en un solo orden, de la publicación más
// nueva a la más vieja (FR-042): una camada recién publicada queda primera.
export function myWallEntries(pets: PetSummary[], litters: MyLitter[]): MyWallEntry[] {
  return [
    ...pets.map((pet): MyWallEntry => ({ kind: 'pet', pet })),
    ...litters.map((litter): MyWallEntry => ({ kind: 'litter', litter })),
  ].sort((a, b) => publishedAt(b) - publishedAt(a))
}
