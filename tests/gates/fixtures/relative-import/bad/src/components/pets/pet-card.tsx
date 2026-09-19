import { listPets } from '../../lib/supabase/queries/pets'

export function PetCard() {
  return <div data-count={String(listPets.length)} />
}
