import { DELETION_ANSWERS, DELETION_KINDS } from '@/lib/pets/deletion-reason'
import type { DeletionSummaryRow } from '@/lib/surveys/deletion-summary'
import { createServerSupabase } from '@/lib/supabase/server'
import { oneOf } from './pet-rows'

/**
 * Las cuentas de «Por qué se borraron animales» para quien administra: las doce combinaciones de
 * clase y respuesta, y nada a quien no administra (data-model §Funciones). La tabla no se lee de
 * otra forma.
 */
export async function deletionReasonSummary(): Promise<DeletionSummaryRow[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('admin_deletion_reason_summary')
  if (error) throw new Error('No se pudo traer por qué se borraron animales', { cause: error })
  return data.map((row) => ({
    kind: oneOf(DELETION_KINDS, row.kind, 'clase de borrado'),
    reason: oneOf(DELETION_ANSWERS, row.reason, 'respuesta al borrar'),
    total: row.total,
  }))
}
