import type { OwnQuestionSummary } from '@/lib/surveys/own-questions'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * «Lo que preguntan quienes publican» para quien administra; null si la base falló o no devolvió la
 * fila, así la sección dice que no se pudo y el resto de Encuestas se ve (FR-023).
 */
export async function ownQuestionSummary(): Promise<OwnQuestionSummary | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('admin_own_question_summary')
  const row = data?.[0]
  if (error || row === undefined) return null
  return { published: row.published, withQuestion: row.with_question, questions: row.questions }
}
