import { getTranslations } from 'next-intl/server'
import { listedCardViews } from '@/components/pets/listing-texts'
import { SuggestedPets } from '@/components/pets/suggested-pets'
import { suggestionHref, suggestionsListingHref } from '@/lib/applications/suggestions'
import type { ListedPet } from '@/lib/pets/types'
import { listHeldSuggestedPets, listSuggestedPets } from '@/lib/supabase/queries/listed-pets'
import { departmentName, type DepartmentCode } from '@/lib/zones/departments'

type Props = {
  /** Una solicitud cerrada (historia #259) o una escrita que no salió (historia #294). */
  source: { kind: 'application' | 'held'; id: string }
  /** El departamento del perfil de quien solicitó: el del listado filtrado. */
  department: DepartmentCode
  /** Lo que queda sin sugeridos; sin nada, la pantalla ya tiene su camino al listado. */
  empty?: React.ReactNode
}

// Si los sugeridos no se pudieron traer, no hay bloque ni aviso: la pantalla queda como hoy, con su
// camino a los animales en adopción (historia #259, criterio 4).
async function suggestedOf(source: Props['source']): Promise<ListedPet[]> {
  try {
    return source.kind === 'held'
      ? await listHeldSuggestedPets(source.id)
      : await listSuggestedPets(source.id)
  } catch {
    return []
  }
}

// Debajo del desenlace y de la encuesta: arriba la empujarían fuera de la pantalla y le sugerirían la
// respuesta a «¿seguís buscando acá?» (docs/03 §7). Cuándo se ofrecen lo decide la página.
export async function MySuggestions({ source, department, empty = null }: Props) {
  const pets = await suggestedOf(source)
  const species = pets[0]?.species
  if (species === undefined) return empty
  const [cards, t] = await Promise.all([
    listedCardViews(pets, { withLevel: true }),
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
