// Covers: US4-AS1, US4-AS5, US4-AS6, US4-AS7, US4-AS8 (cada resultado de la búsqueda a lo que se ve)
import { describe, expect, it } from 'vitest'
import { searchOutcome } from './search-outcome'
import type { PersonResult } from './types'

const ana: PersonResult = {
  publicId: 'AbCdEfGhIjKlMnOpQrSt_-',
  name: 'Ana Pérez',
  avatarUrl: null,
  department: 'UY-MO',
  locality: 'Pocitos',
  isSuspended: false,
}

const refused = (error: string) => searchOutcome({ kind: 'result', result: { ok: false, error } })

describe('searchOutcome', () => {
  it('con personas, las muestra y dice si hay más', () => {
    expect(
      searchOutcome({ kind: 'result', result: { ok: true, data: { people: [ana], more: true } } }),
    ).toEqual({ kind: 'results', people: [ana], more: true })
    expect(
      searchOutcome({ kind: 'result', result: { ok: true, data: { people: [ana], more: false } } }),
    ).toEqual({ kind: 'results', people: [ana], more: false })
  })

  it('sin personas, dice que no encontró a nadie', () => {
    expect(
      searchOutcome({ kind: 'result', result: { ok: true, data: { people: [], more: false } } }),
    ).toEqual({ kind: 'none' })
  })

  it('cada error de la acción a su texto', () => {
    expect(refused('admin.search.errors.too_short')).toEqual({ kind: 'error', error: 'too_short' })
    expect(refused('admin.search.errors.too_long')).toEqual({ kind: 'error', error: 'too_long' })
    expect(refused('admin.search.errors.not_admin')).toEqual({ kind: 'error', error: 'not_admin' })
    expect(refused('admin.search.errors.failed')).toEqual({ kind: 'error', error: 'failed' })
  })

  it('un error que no es de la búsqueda, o ninguna respuesta, es la conexión', () => {
    expect(refused('moderation.errors.failed')).toEqual({ kind: 'error', error: 'failed' })
    expect(refused('constructor')).toEqual({ kind: 'error', error: 'failed' })
    expect(searchOutcome({ kind: 'threw' })).toEqual({ kind: 'error', error: 'failed' })
    expect(searchOutcome({ kind: 'timeout' })).toEqual({ kind: 'error', error: 'failed' })
  })
})
