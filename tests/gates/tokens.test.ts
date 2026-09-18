// «Un valor que no está en este doc no existe» (docs/10 §Tokens). Esta es la compuerta que lo hace
// mecánico: lee los tokens que el doc nombra y los compara con lo que globals.css define.
//
//   · nombres: falla por token faltante y por token de más, en toda la sección;
//   · valores: falla por valor distinto en los que el doc da en tabla (color, escala tipográfica
//     con su interlínea, movimiento, recursos del cartel). Los que el doc da en prosa (espacio,
//     radio, sombra) se verifican por nombre: su valor está escrito de forma que no se deja leer
//     sin ambigüedad, y prometer más que eso sería mentir sobre lo que esta prueba mira.
//
// Está en tests/gates/ y no al lado de globals.css porque es una compuerta, no el test de un
// módulo: prueba la correspondencia entre el doc y el código.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const DOC = 'docs/10-design-system.md'
const CSS = 'src/styles/globals.css'

// Configuración del tema, no tokens (FR-027): el doc los nombra sin token y no cuentan.
const THEME_CONFIG = /^--(?:spacing|breakpoint-)/

function tokensSection(): string {
  const doc = readFileSync(DOC, 'utf8')
  return doc.slice(doc.indexOf('## Tokens'), doc.indexOf('## Layout'))
}

function tokensNamedInDoc(): Set<string> {
  const section = tokensSection()
  const named = new Set<string>()
  for (const match of section.matchAll(/`(--[a-z0-9-]+)`/g)) {
    named.add(match[1])
  }

  // La escala de espacio se escribe abreviada y cortada en dos renglones:
  //   `--space-1` 4 · `2` 8 · `3` 12 · … · `16` 64.
  // Se aplana la sección y se toma hasta el punto que cierra la oración.
  const flat = section.replaceAll(/\n\s+/g, ' ')
  const spaceSentence = flat.match(/--space-1`[^.]*/)?.[0] ?? ''
  for (const match of spaceSentence.matchAll(/`(\d+)`/g)) {
    named.add(`--space-${match[1]}`)
  }
  return named
}

// Las filas de tabla de la sección: | `--token` | valor | uso |
function tableValuesInDoc(): Map<string, string> {
  const values = new Map<string, string>()
  for (const match of tokensSection().matchAll(/^\| `(--[a-z0-9-]+)` \| ([^|]+) \|/gm)) {
    values.set(match[1], match[2])
  }
  return values
}

function definedInCss(): Map<string, string> {
  const css = readFileSync(CSS, 'utf8')
  const defined = new Map<string, string>()
  for (const match of css.matchAll(/^\s{2}(--[a-z0-9-]+):\s*([^;]+);/gm)) {
    defined.set(match[1], match[2].trim())
  }
  return defined
}

// El doc escribe para personas y el CSS pasa por Prettier: `#FFFFFF` y `#ffffff`, `120 ms` y
// `120ms`, `.2` y `0.2` son el mismo valor.
function normalise(value: string): string {
  return value
    .replaceAll('`', '')
    .toLowerCase()
    .replaceAll(/\s+/g, '')
    .replaceAll(/(^|[(,/])0\./g, '$1.')
}

describe('los tokens del código son los del sistema de diseño', () => {
  const named = tokensNamedInDoc()
  const css = definedInCss()
  const tokensInCss = [...css.keys()].filter(
    (name) => !name.endsWith('--line-height') && !THEME_CONFIG.test(name),
  )

  it('no falta ninguno en globals.css', () => {
    expect([...named].filter((token) => !css.has(token)).sort()).toEqual([])
  })

  it('no hay ninguno de más en globals.css', () => {
    expect(tokensInCss.filter((token) => !named.has(token)).sort()).toEqual([])
  })

  it('los que el doc da en tabla tienen el mismo valor', () => {
    const different: string[] = []
    for (const [token, docValue] of tableValuesInDoc()) {
      const size = css.get(token) ?? ''
      const leading = css.get(`${token}--line-height`)
      // La escala tipográfica se escribe `13 / 1.4`: tamaño en px e interlínea.
      const cssValue = leading === undefined ? size : `${size.replace(/px$/, '')}/${leading}`
      if (normalise(docValue) !== normalise(cssValue)) {
        different.push(`${token}: doc «${docValue.trim()}», css «${cssValue}»`)
      }
    }
    expect(different).toEqual([])
  })

  it('cada token de la escala tipográfica lleva su interlínea', () => {
    const sizes = [...named].filter((token) => /^--text-/.test(token))
    expect(sizes).toHaveLength(8)
    expect(sizes.filter((token) => !css.has(`${token}--line-height`))).toEqual([])
  })
})
