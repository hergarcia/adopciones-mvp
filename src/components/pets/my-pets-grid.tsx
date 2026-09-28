import { getTranslations } from 'next-intl/server'
import type { PetSummary } from '@/lib/pets/types'
import { zoneName } from '@/lib/zones/zone-name'
import { MyPetActions } from './my-pet-actions'
import { PetCard } from './pet-card'
import { shareTexts } from './share-texts'

// Dos columnas, tres desde 768 y cuatro desde 1024 (docs/10 §Layout). El espacio entre fotos es
// `--space-8`: cada cinta sobresale su esquina, y con menos las de dos vecinas se tocan y las fotos
// se leen pegadas con la misma tira. La comparte el `loading` de «Mis animales».
export const PET_WALL_GRID = 'grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4'

// La pared de lo que la persona ya pegó, con las mismas cards que va a tener el listado público.
export async function MyPetsGrid({ pets }: { pets: PetSummary[] }) {
  const t = await getTranslations('pets.my_pets')
  const seePet = (await getTranslations('pets.page'))('see_pet')
  const shares = await Promise.all(pets.map((pet) => shareTexts(pet.name)))

  return (
    <ul className={PET_WALL_GRID}>
      {pets.map((pet, index) => (
        <li key={pet.id} className="flex flex-col gap-1">
          <PetCard
            pet={pet}
            index={index}
            texts={{
              urgent: t('urgent'),
              alt: t('photo_alt', {
                name: pet.name,
                species: pet.species,
                sex: pet.sex,
                zone: zoneName(pet.zone),
              }),
            }}
          />
          <MyPetActions code={pet.code} texts={{ seePet, share: shares[index] }} />
        </li>
      ))}
    </ul>
  )
}
