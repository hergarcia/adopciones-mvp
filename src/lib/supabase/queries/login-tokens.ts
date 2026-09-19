import { createServiceSupabase } from '@/lib/supabase/service'

// Genera el enlace de ingreso **sin mandar nada**: el correo lo manda el producto, para que su
// texto viva en messages/es.json y sea traducible (docs/06). Crea la persona si no existía, así
// que quien pide el enlace nunca se entera de si esa dirección ya tenía cuenta (FR-006a).
export async function generateLoginToken(email: string): Promise<string | null> {
  const { data, error } = await createServiceSupabase().auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error || !data.properties) return null
  return data.properties.hashed_token
}
