import { cache } from 'react'
import { createServerSupabase } from '@/lib/supabase/server'
import type { PhoneRow } from '@/lib/verification/phone-status'

// El teléfono de quien está mirando, con su sesión y su RLS: la única policy de la tabla deja leer
// la fila propia y nada más (FR-019). Nulo sin fila, sin sesión o si la base no respondió; para las
// pantallas es lo mismo que no tener teléfono, y la falla se ve en el `error.tsx` de la ruta.
export const getMyPhone = cache(async (): Promise<PhoneRow | null> => {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data, error } = await supabase
    .from('phones')
    .select('verified_number, verified_at, pending_number, pending_since')
    .eq('user_id', auth.user.id)
    .maybeSingle()
  if (error) throw new Error('No se pudo leer el teléfono', { cause: error })
  if (!data) return null

  return {
    verifiedNumber: data.verified_number,
    verifiedAt: data.verified_at === null ? null : new Date(data.verified_at),
    pendingNumber: data.pending_number,
    pendingSince: data.pending_since === null ? null : new Date(data.pending_since),
  }
})
