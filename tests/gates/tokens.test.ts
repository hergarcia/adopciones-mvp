// Está en tests/gates/ y no al lado de globals.css porque es una compuerta, no el test de un
// módulo: prueba la correspondencia entre docs/10 §Tokens y el código.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const DOC = 'docs/10-design-system.md'
const CSS = 'src/styles/globals.css'

// Configuración del tema, no tokens (FR-027): el doc los nombra sin token y no cuentan.
const THEME_CONFIG = /^--(?:spacing|breakpoint-|container-)/

// El doc nombra la familia pero su valor es la pila de fuentes de next/font, que no es del doc.
const NAMED_WITHOUT_VALUE = ['--font-sans']

function tokensSection(): string {
  const doc = readFileSync(DOC, 'utf8')
  return doc.slice(doc.indexOf('## Tokens'), doc.indexOf('## Layout'))
}

function tokensNamedInDoc(): Set<string> {
  const section = tokensSection()
  const named = new Set<string>()
  for (const match of section.matchAll(/`(--[a-z0-9-]+)`/g)) {
    if (!THEME_CONFIG.test(match[1])) named.add(match[1])
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

// Los valores en prosa, en las tres formas en que el doc los escribe:
//   `--radius-stamp` 3 px   ·   `--shadow-lift` (`0 6px …`)   ·   (`--stretch-afiche`, 75 %)
// y la escala de espacio abreviada: `--space-1` 4 · `2` 8 · …
function proseValuesInDoc(): Map<string, string> {
  const flat = tokensSection().replaceAll(/\n\s*/g, ' ')
  const values = new Map<string, string>()
  const mention =
    /`(--[a-z0-9-]+)`,?\s+(?:\(`([^`]+)`\)|(-?\d+(?:\.\d+)?)(?:\s?(px|%|ms|em|deg))?)/g
  for (const [, token, quoted, amount, unit] of flat.matchAll(mention)) {
    if (!THEME_CONFIG.test(token)) values.set(token, quoted ?? `${amount}${unit ?? ''}`)
  }
  const spaceSentence = flat.match(/--space-1`[^.]*/)?.[0] ?? ''
  for (const [, step, amount] of spaceSentence.matchAll(/`(\d+)` (\d+)/g)) {
    values.set(`--space-${step}`, amount)
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

  it('los que el doc da en prosa tienen el mismo valor', () => {
    const different: string[] = []
    for (const [token, docValue] of proseValuesInDoc()) {
      const cssValue = normalise(css.get(token) ?? '')
      const expected = normalise(docValue)
      // El doc escribe la escala de espacio y los pesos sin unidad; el espacio es en px.
      const isSame =
        cssValue === expected || (/^\d+$/.test(expected) && cssValue === `${expected}px`)
      if (!isSame) different.push(`${token}: doc «${docValue}», css «${css.get(token) ?? ''}»`)
    }
    expect(different).toEqual([])
  })

  it('ningún token queda sin valor verificado, salvo los anotados', () => {
    const verified = new Set([...tableValuesInDoc().keys(), ...proseValuesInDoc().keys()])
    expect([...named].filter((token) => !verified.has(token)).sort()).toEqual(NAMED_WITHOUT_VALUE)
  })

  it('cada token de la escala tipográfica lleva su interlínea', () => {
    const sizes = [...named].filter((token) => /^--text-/.test(token))
    expect(sizes).toHaveLength(8)
    expect(sizes.filter((token) => !css.has(`${token}--line-height`))).toEqual([])
  })
})
