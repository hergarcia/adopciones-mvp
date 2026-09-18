import { createClient } from '@/lib/supabase/client'

export function PetCard() {
  const supabase = createClient()
  return <div>{String(supabase)}</div>
}
