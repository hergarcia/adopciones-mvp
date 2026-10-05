// Covers: FR-019, US2-AS6 (research R4: ninguna pantalla ni acción deja pasar a una suspendida)
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..', '..', '..')
const SRC = join(ROOT, 'src')

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

function repoPath(path: string): string {
  return relative(ROOT, path).split(sep).join('/')
}

const SOURCES = walk(SRC).filter(
  (path) => /\.(ts|tsx)$/.test(path) && !/\.test\.(ts|tsx)$/.test(path),
)

// La sesión sin puerta, y por qué cada uno la necesita: el menú no redirige con el HTML ya
// saliendo; borrar la cuenta es lo que una suspendida sí puede hacer, y guardar el perfil y avalar
// distinguen una sesión vencida de una falla antes de pasar por la puerta; la pantalla de cuenta
// suspendida es adonde la puerta manda.
const UNGATED = [
  'src/actions/profile.ts',
  'src/actions/vouches.ts',
  'src/app/[locale]/(suspended)/cuenta-suspendida/page.tsx',
  'src/app/[locale]/_components/account-menu.tsx',
  'src/lib/supabase/queries/session.ts',
]

describe('la puerta de la cuenta suspendida', () => {
  it('solo la lista cerrada lee la sesión sin puerta', () => {
    const readers = SOURCES.filter((path) => readFileSync(path, 'utf8').includes('lookupSession'))
    expect(readers.map(repoPath).toSorted()).toEqual(UNGATED)
  })

  it('cada página de los tres grupos pasa por la puerta antes de pintar', () => {
    const pages = SOURCES.filter((path) =>
      /\/\((public|app|auth)\)\/(.+\/)?page\.tsx$/.test(repoPath(path)),
    )
    const ungated = pages
      .filter((path) => !/(redirectIfSuspended|requireProfile)\(/.test(readFileSync(path, 'utf8')))
      .map(repoPath)
    expect(pages.length).toBeGreaterThan(20)
    expect(ungated).toEqual([])
  })

  // La foto del enlace no: es una imagen, y `renewal_link_view` ya no la da si está suspendida.
  it('el enlace «Sigue disponible», que renueva, también', () => {
    const [route] = SOURCES.filter((path) =>
      repoPath(path).endsWith('/sigue-disponible/[token]/route.ts'),
    )
    expect(route).toBeDefined()
    expect(readFileSync(route ?? '', 'utf8')).toContain('redirectIfSuspended(')
  })
})
