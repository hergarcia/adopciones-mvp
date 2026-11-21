import { litterGroupPost, petGroupPost } from '@/components/pets/group-post-texts'
import type { GroupPostTexts } from '@/components/pets/group-post-button'
import type { MyLitter } from '@/lib/litters/types'
import type { PetSummary } from '@/lib/pets/types'
import { receivesApplications } from '@/lib/share/group-post'
import { getLitterByCode } from '@/lib/supabase/queries/litters'
import { getPublicPet } from '@/lib/supabase/queries/listed-pets'

// El texto para el grupo de cada animal y camada de «Mis animales» que hoy recibe solicitudes, por
// id (historia #248). Se arma con la misma lectura que la ficha, así los dos lugares copian el mismo
// texto. Si una lectura falla, ese animal se queda sin el botón: «Compartir» sigue.
export async function myGroupPosts(
  pets: readonly PetSummary[],
  litters: readonly MyLitter[],
): Promise<ReadonlyMap<string, GroupPostTexts>> {
  const forPets = pets
    .filter((pet) => receivesApplications(pet.state))
    .map(async (pet) => {
      const result = await getPublicPet(pet.code)
      return [
        pet.id,
        result !== null && 'code' in result ? await petGroupPost(result) : null,
      ] as const
    })
  const forLitters = litters
    .filter(
      (litter) =>
        litter.state === 'available' && litter.young.some((one) => receivesApplications(one.state)),
    )
    .map(async (litter) => {
      const result = await getLitterByCode(litter.code)
      return [
        litter.id,
        result !== null && 'code' in result ? await litterGroupPost(result) : null,
      ] as const
    })
  const entries = await Promise.all(
    [...forPets, ...forLitters].map((entry) => entry.catch(() => null)),
  )
  return new Map(
    entries.flatMap((entry) =>
      entry === null || entry[1] === null ? [] : [[entry[0], entry[1]] as const],
    ),
  )
}
