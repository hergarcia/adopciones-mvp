import { createClient } from '@/lib/supabase/client'

export function listPets() {
  return createClient().from('pets').select()
}
