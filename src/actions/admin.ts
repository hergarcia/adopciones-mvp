'use server'

import type { SearchFound } from '@/lib/admin/search-outcome'
import { searchDoneEvent } from '@/lib/analytics/admin-events'
import { trackAll } from '@/lib/analytics/track'
import { ADMIN_SEARCH_LIMIT, adminSearchSchema } from '@/lib/schemas/admin-search'
import { searchPeopleRows } from '@/lib/supabase/queries/admin'
import { signAvatarUrls } from '@/lib/supabase/queries/avatars'
import { isAdmin } from '@/lib/supabase/queries/review'
import type { ActionResult } from './result'

const TOO_SHORT = 'admin.search.errors.too_short'
const NOT_ADMIN = 'admin.search.errors.not_admin'
const FAILED = 'admin.search.errors.failed'

// Buscar a una persona por nombre desde Administrar (US4). La base vuelve a preguntar si la sesión
// administra y no devuelve nada a nadie más; preguntarlo antes es para decir por qué no hay nada.
// La foto va firmada con la sesión, que la policy de quien administra deja leer (research R10).
export async function searchPeople(input: unknown): Promise<ActionResult<SearchFound>> {
  const parsed = adminSearchSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? TOO_SHORT }

  try {
    if (!(await isAdmin())) return { ok: false, error: NOT_ADMIN }
    const rows = await searchPeopleRows(parsed.data.query, ADMIN_SEARCH_LIMIT)
    const shown = rows.slice(0, ADMIN_SEARCH_LIMIT)
    const signed = await signAvatarUrls(
      shown.flatMap((row) => (row.avatarPath === null ? [] : [row.avatarPath])),
    )
    const people = shown.map(({ avatarPath, ...row }) => ({
      ...row,
      avatarUrl: avatarPath === null ? null : (signed.get(avatarPath) ?? null),
    }))
    await trackAll([searchDoneEvent(people.length > 0)], { visit: false })
    return { ok: true, data: { people, more: rows.length > ADMIN_SEARCH_LIMIT } }
  } catch {
    return { ok: false, error: FAILED }
  }
}
