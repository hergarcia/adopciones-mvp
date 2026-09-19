// «Lo que no está en docs/10 no existe» solo es cierto si los valores por defecto de Tailwind están
// apagados en las familias que el doc gobierna. Se compila la hoja real y se mira qué utilidades
// salen: un `--x-*: initial` borrado de globals.css pone esto en rojo.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

const CSS = 'src/styles/globals.css'
const require = createRequire(import.meta.url)

async function utilitiesFor(candidates: string[]): Promise<string> {
  const compiler = await compile(readFileSync(CSS, 'utf8'), {
    base: dirname(resolve(CSS)),
    loadStylesheet: (id, base) => {
      const path =
        id === 'tailwindcss' ? require.resolve('tailwindcss/index.css') : resolve(base, id)
      return Promise.resolve({ path, base: dirname(path), content: readFileSync(path, 'utf8') })
    },
  })
  return compiler.build(candidates)
}

const OFF_SYSTEM = [
  'bg-red-500',
  'text-5xl',
  'font-serif',
  'font-mono',
  'font-semibold',
  'tracking-widest',
  'leading-loose',
  'rounded-xl',
  'shadow-lg',
  'drop-shadow-md',
  'inset-shadow-sm',
  'text-shadow-sm',
  'blur-sm',
  'ease-in',
  'animate-spin',
  'max-w-sm',
  'xl:block',
]

describe('los valores por defecto de Tailwind están apagados', () => {
  it('ninguna utilidad fuera del sistema compila', async () => {
    // Lo que sale sin pedir ninguna utilidad: si pedir una no cambia nada, esa utilidad no existe.
    const nothing = await utilitiesFor([])
    const outputs = await Promise.all(OFF_SYSTEM.map((candidate) => utilitiesFor([candidate])))
    const generated = OFF_SYSTEM.filter((_, index) => outputs[index] !== nothing)
    expect(generated).toEqual([])
  })

  it('las del sistema sí', async () => {
    const css = await utilitiesFor([
      'bg-ink',
      'text-4xl',
      'font-black',
      'shadow-float',
      'max-w-page',
    ])
    for (const name of ['bg-ink', 'text-4xl', 'font-black', 'shadow-float', 'max-w-page']) {
      expect(css).toContain(`.${name}`)
    }
  })
})
