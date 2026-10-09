import type { ActionResult } from '@/actions/result'
import type { ActionAttempt } from '@/lib/forms/action-deadline'
import type { PersonResult } from './types'

export type SearchFound = { people: PersonResult[]; more: boolean }

/** Las claves de `admin.search.errors`. */
export type SearchError = 'too_short' | 'too_long' | 'not_admin' | 'failed'

export type SearchOutcome =
  | { kind: 'results'; people: PersonResult[]; more: boolean }
  | { kind: 'none' }
  | { kind: 'error'; error: SearchError }

const KNOWN = new Map<string, SearchError>([
  ['admin.search.errors.too_short', 'too_short'],
  ['admin.search.errors.too_long', 'too_long'],
  ['admin.search.errors.not_admin', 'not_admin'],
])

// Lo que ve quien busca después de buscar (FR-053, FR-054): una acción que no respondió, o que
// respondió con un error que no es suyo, es «No se pudo buscar por la conexión», y lo escrito queda.
export function searchOutcome(attempt: ActionAttempt<ActionResult<SearchFound>>): SearchOutcome {
  if (attempt.kind !== 'result') return { kind: 'error', error: 'failed' }
  const { result } = attempt
  if (!result.ok) return { kind: 'error', error: KNOWN.get(result.error) ?? 'failed' }
  const { people, more } = result.data
  return people.length === 0 ? { kind: 'none' } : { kind: 'results', people, more }
}
