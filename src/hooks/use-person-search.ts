'use client'

import { useState } from 'react'
import type { ActionResult } from '@/actions/result'
import { searchOutcome, type SearchFound, type SearchOutcome } from '@/lib/admin/search-outcome'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { adminSearchSchema } from '@/lib/schemas/admin-search'

export type PeopleSearch = (input: { query: string }) => Promise<ActionResult<SearchFound>>

// Buscar por nombre (FR-051 a FR-054): con menos de 3 letras no se llama a la acción; un segundo
// toque mientras busca no hace nada; y lo escrito no se toca nunca, tampoco si la búsqueda falla.
export function usePersonSearch(search: PeopleSearch) {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null)

  async function submit(): Promise<SearchOutcome | null> {
    if (busy) return null
    const parsed = adminSearchSchema.safeParse({ query })
    if (!parsed.success) {
      const error = parsed.error.issues[0]?.message ?? ''
      const refused = searchOutcome({ kind: 'result', result: { ok: false, error } })
      setOutcome(refused)
      return refused
    }
    setBusy(true)
    const attempt = navigator.onLine
      ? await raceDeadline(search(parsed.data), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    const next = searchOutcome(attempt)
    setBusy(false)
    setOutcome(next)
    return next
  }

  return { query, setQuery, busy, outcome, submit }
}
