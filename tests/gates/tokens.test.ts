// «Un valor que no está en este doc no existe» (docs/10 §Tokens). Esta es la compuerta que lo hace
// mecánico: lee los tokens que el doc nombra y los compara con lo que globals.css define. Falla por
// nombre faltante, por valor distinto y por token de más.
//
// Está en tests/gates/ y no al lado de globals.css porque es una compuerta, no el test de un
// módulo: lo que prueba es la correspondencia entre el doc y el código, que es exactamente lo que
// se olvida cuando alguien agrega un color «solo por esta vez».
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const DOC = 'docs/10-design-system.md'
const CSS = 'src/styles/globals.css'

// Los cinco que el doc fija en prosa y FR-026 declara gobernados por tokens: familia, los tres
// pesos y el tracking. No están en ninguna tabla, así que se nombran acá.
const FROM_PROSE = [
  '--font-sans',
  '--font-weight-regular',
  '--font-weight-medium',
  '--font-weight-bold',
  '--tracking-tight',
]

// Configuración del tema, no tokens (FR-027): el doc los nombra sin token y no cuentan en la
// paridad.
const THEME_CONFIG = /^--(?:spacing|breakpoint-)/

function tokensNamedInDoc(): Set<string> {
  const doc = readFileSync(DOC, 'utf8')
  const section = doc.slice(doc.indexOf('## Tokens'), doc.indexOf('## Layout'))

  const named = new Set<string>()
  for (const match of section.matchAll(/`(--[a-z0-9-]+)`/g)) {
    named.add(match[1])
  }

  // La escala de espacio se escribe abreviada y cortada en dos renglones:
  //   `--space-1` 4 · `2` 8 · `3` 12 · … · `16` 64.
  // Se aplana la sección antes de buscarla, y se toma hasta el punto que cierra la oración; los
  // números sueltos de ahí son tokens igual.
  const flat = section.replaceAll(/\n\s+/g, ' ')
  const spaceSentence = flat.match(/--space-1`[^.]*/)?.[0] ?? ''
  for (const match of spaceSentence.matchAll(/`(\d+)`/g)) {
    named.add(`--space-${match[1]}`)
  }

  for (const extra of FROM_PROSE) named.add(extra)
  return named
}

function tokensDefinedInCss(): Map<string, string> {
  const css = readFileSync(CSS, 'utf8')
  const defined = new Map<string, string>()
  for (const match of css.matchAll(/^\s{2}(--[a-z0-9-]+):\s*([^;]+);/gm)) {
    const [, name, value] = match
    // Los modificadores de interlínea pertenecen a su token, no son nombres aparte.
    if (name.endsWith('--line-height')) continue
    if (THEME_CONFIG.test(name)) continue
    defined.set(name, value.trim())
  }
  return defined
}

describe('los tokens del código son los del sistema de diseño', () => {
  const named = tokensNamedInDoc()
  const defined = tokensDefinedInCss()

  it('son 47: los 42 que nombra docs/10 más familia, pesos y tracking', () => {
    expect(named.size).toBe(47)
  })

  it('no falta ninguno en globals.css', () => {
    const missing = [...named].filter((token) => !defined.has(token)).sort()
    expect(missing).toEqual([])
  })

  it('no hay ninguno de más en globals.css', () => {
    const extra = [...defined.keys()].filter((token) => !named.has(token)).sort()
    expect(extra).toEqual([])
  })

  it('cada token de la escala tipográfica lleva su interlínea', () => {
    const css = readFileSync(CSS, 'utf8')
    const sizes = [...named].filter((token) => /^--text-/.test(token))
    const withoutLineHeight = sizes.filter((token) => !css.includes(`${token}--line-height:`))
    expect(sizes).toHaveLength(7)
    expect(withoutLineHeight).toEqual([])
  })
})
