import { createClient } from '../supabase/client'

export function listPets() {
  return createClient().from('pets').select()
}
