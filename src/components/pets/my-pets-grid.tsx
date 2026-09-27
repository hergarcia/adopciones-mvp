import { getTranslations } from 'next-intl/server'
import type { PetSummary } from '@/lib/pets/types'
import { zoneName } from '@/lib/zones/zone-name'
import { PetCard } from './pet-card'

// La pared de lo que la persona ya pegó: dos columnas, tres desde 768 y cuatro desde 1024 (docs/10
// §Layout), las mismas cards que va a tener el listado público.
export async function MyPetsGrid({ pets }: { pets: PetSummary[] }) {
  const t = await getTranslations('pets.my_pets')

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
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
