import { createServiceSupabase } from '@/lib/supabase/service'

// La dirección de otra cuenta, con permisos de servicio: la usa solo el correo a la cuenta que
// perdió su número (FR-010), y no sale del servidor.
export async function getAccountEmail(userId: string): Promise<string | null> {
  const { data, error } = await createServiceSupabase().auth.admin.getUserById(userId)
  return error ? null : (data.user?.email ?? null)
}
