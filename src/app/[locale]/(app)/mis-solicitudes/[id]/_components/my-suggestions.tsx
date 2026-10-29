import { getTranslations } from 'next-intl/server'
import { listedCardViews } from '@/components/pets/listing-texts'
import { SuggestedPets } from '@/components/pets/suggested-pets'
import { suggestionHref, suggestionsListingHref } from '@/lib/applications/suggestions'
import type { ListedPet } from '@/lib/pets/types'
import { listSuggestedPets } from '@/lib/supabase/queries/listed-pets'
import { departmentName, type DepartmentCode } from '@/lib/zones/departments'

type Props = {
  applicationId: string
  /** El departamento del perfil de quien solicitó: el del listado filtrado. */
  department: DepartmentCode
}

// Si los sugeridos no se pudieron traer, no hay bloque ni aviso: la pantalla queda como hoy, con su
// camino a los animales en adopción (historia #259, criterio 4).
async function suggestedOf(applicationId: string): Promise<ListedPet[]> {
  try {
    return await listSuggestedPets(applicationId)
  } catch {
    return []
  }
}

// Debajo del desenlace y de la encuesta: arriba la empujarían fuera de la pantalla y le sugerirían la
// respuesta a «¿seguís buscando acá?» (docs/03 §7). Cuándo se ofrecen lo decide la página.
export async function MySuggestions({ applicationId, department }: Props) {
  const pets = await suggestedOf(applicationId)
  const species = pets[0]?.species
  if (species === undefined) return null
  const [cards, t] = await Promise.all([
    listedCardViews(pets),
    getTranslations('applications.suggestions'),
  ])
  return (
    <SuggestedPets
      cards={cards.map((card) => ({ ...card, href: suggestionHref(card.href) }))}
      listingHref={suggestionsListingHref(species, department)}
      texts={{
        title: t('title', { species }),
        toListing: t('to_listing', { species, department: departmentName(department) }),
      }}
    />
  )
}
