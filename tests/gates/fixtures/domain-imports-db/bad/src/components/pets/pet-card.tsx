import { listPets } from '@/lib/supabase/queries/pets'

export function PetCard() {
  return <div>{String(listPets)}</div>
}
