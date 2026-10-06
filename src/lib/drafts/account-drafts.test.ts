// Covers: FR-041 de la #63 (el borrador de cada solicitud se borra al cerrar sesión y al borrar la
// cuenta), FR-024 de la #53
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearAccountDrafts } from './account-drafts'

function memoryStorage(entries: Record<string, string>): Storage {
  const data = new Map(Object.entries(entries))
  return {
    get length() {
      return data.size
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
  }
}

function keysAfterClearing(entries: Record<string, string>): string[] {
  const storage = memoryStorage(entries)
  vi.stubGlobal('window', { localStorage: storage })
  clearAccountDrafts()
  return Array.from({ length: storage.length }, (_, index) => storage.key(index) ?? '')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('clearAccountDrafts', () => {
  it('borra el perfil, la publicación y el borrador de cada solicitud, y nada más', () => {
    expect(
      keysAfterClearing({
        'profile-draft': '{}',
        'pet-draft': '{}',
        'application-draft:semana0001': '{}',
        'application-draft:semana0002': '{}',
        'otra-cosa': 'x',
        'mi-application-draft:semana0003': 'x',
      }),
    ).toEqual(['otra-cosa', 'mi-application-draft:semana0003'])
  })

  it('sin nada guardado no rompe', () => {
    expect(keysAfterClearing({})).toEqual([])
  })

  it('sin almacenamiento no rompe', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new Error('bloqueado')
      },
    })
    expect(() => clearAccountDrafts()).not.toThrow()
  })
})
