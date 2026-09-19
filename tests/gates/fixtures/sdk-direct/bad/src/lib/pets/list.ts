import { createClient } from '@supabase/supabase-js'

export function listPets(url: string, key: string) {
  return createClient(url, key).from('pets').select()
}
