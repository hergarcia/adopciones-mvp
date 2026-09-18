import { listPetsQuery } from '@/lib/supabase/queries/pets'

export function listPets() {
  return listPetsQuery()
}
