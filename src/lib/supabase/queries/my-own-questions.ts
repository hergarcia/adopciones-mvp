import type { OwnQuestionSource } from '@/lib/pets/own-question-suggestions'
import { createServerSupabase } from '@/lib/supabase/server'

// Más que esto no hace falta para encontrar 3 distintas, y una cuenta con cientos no las lee todas.
const READ_MAX = 50

type Row = { id: string; name: string; own_question: string | null; published_at: string }

function sourcesOf(rows: Row[]): OwnQuestionSource[] {
  return rows.flatMap((row) =>
    row.own_question === null
      ? []
      : [
          {
            id: row.id,
            name: row.name,
            question: row.own_question,
            publishedAt: new Date(row.published_at),
          },
        ],
  )
}

/**
 * Las preguntas propias de la sesión, de sus animales sueltos y sus camadas en cualquier estado
 * (historia #300); la RLS deja ver solo las propias. Si la base falla, ninguna: es una ayuda para
 * escribir y publicar no se frena por ella.
 */
export async function listMyOwnQuestions(): Promise<OwnQuestionSource[]> {
  const supabase = await createServerSupabase()
  const [pets, litters] = await Promise.all([
    supabase
      .from('pets')
      .select('id, name, own_question, published_at')
      .is('litter_id', null)
      .not('own_question', 'is', null)
      .order('published_at', { ascending: false })
      .limit(READ_MAX),
    supabase
      .from('litters')
      .select('id, name, own_question, published_at')
      .not('own_question', 'is', null)
      .order('published_at', { ascending: false })
      .limit(READ_MAX),
  ])
  return [...sourcesOf(pets.data ?? []), ...sourcesOf(litters.data ?? [])]
}
