import { isPublisherLevel } from '@/lib/pets/publisher-level'
import { PET_CODE_PATTERN } from '@/lib/pets/rules'
import type { Publisher } from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'

// El nivel sale de la misma lectura que la ficha, así la vista previa nunca dice uno más alto que el
// que la ficha muestra en ese momento. Va aparte de la tarjeta para que una falla deje la imagen sin
// nivel en lugar de sin imagen.
/** El nivel de quien publicó, tal como lo dice la ficha, o null si la ficha no lo dice. */
export async function publisherLevelByCode(
  rpc: 'pet_by_code' | 'litter_by_code',
  code: string,
): Promise<Publisher['level']> {
  if (!PET_CODE_PATTERN.test(code)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc(rpc, { p_code: code })
  if (error) throw new Error('No se pudo traer el nivel de quien publicó', { cause: error })
  const level = data[0]?.publisher_level ?? null
  return isPublisherLevel(level) ? level : null
}
