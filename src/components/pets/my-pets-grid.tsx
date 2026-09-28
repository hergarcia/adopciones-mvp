import { getTranslations } from 'next-intl/server'
import type { PetSummary } from '@/lib/pets/types'
import { zoneName } from '@/lib/zones/zone-name'
import { PetCard } from './pet-card'

// Dos columnas, tres desde 768 y cuatro desde 1024 (docs/10 §Layout). El espacio entre fotos es
// `--space-8`: cada cinta sobresale su esquina, y con menos las de dos vecinas se tocan y las fotos
// se leen pegadas con la misma tira. La comparte el `loading` de «Mis animales».
export const PET_WALL_GRID = 'grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4'

// La pared de lo que la persona ya pegó, con las mismas cards que va a tener el listado público.
export async function MyPetsGrid({ pets }: { pets: PetSummary[] }) {
  const t = await getTranslations('pets.my_pets')

  return (
    <ul className={PET_WALL_GRID}>
      {pets.map((pet, index) => (
        <li key={pet.id}>
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
        </li>
      ))}
    </ul>
  )
}
