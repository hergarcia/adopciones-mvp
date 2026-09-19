// Una regla que nunca se vio fallar no es una compuerta. Cada regla que este repo pone se
// demuestra acá con un ejemplo que la viola y su versión corregida, corriendo **la configuración
// real**: si alguien apaga una regla en .oxlintrc.json, este test se pone rojo.
//
// oxlint se invoca desde la raíz del repo, no desde el fixture: `jsPlugins` se resuelve contra el
// directorio de trabajo, así que desde otro lado el plugin propio no cargaría y la demostración
// pasaría en verde sin haber mirado nada. Los globs de los overrides llevan prefijo `**/src/…`
// justamente para matchear el árbol real y el del fixture con la misma configuración.
import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

type Case = {
  /** Carpeta bajo tests/gates/fixtures/ */
  fixture: string
  /** Las reglas que el reporte tiene que nombrar. Todas: con una sola afirmada, las demás se
   *  podrían apagar y la demostración seguiría en verde. */
  rules: string[]
  /** Qué está demostrando, en la línea del test */
  what: string
}

const CASES: Case[] = [
  {
    fixture: 'jsx-literal',
    rules: ['jsx-no-literals'],
    what: 'un texto visible literal fuera de ui/',
  },
  {
    fixture: 'hex-color',
    rules: ['no-hex-color-in-component'],
    what: 'un hexadecimal en un componente',
  },
  {
    fixture: 'from-outside-queries',
    rules: ['no-restricted-imports'],
    what: 'la base llamada fuera de lib/supabase/queries/',
  },
  {
    fixture: 'ui-imports-domain',
    rules: ['no-restricted-imports'],
    what: 'una primitiva ui/ que importa de un dominio',
  },
  {
    fixture: 'domain-imports-db',
    rules: ['no-restricted-imports'],
    what: 'un componente de dominio que importa el cliente de la base',
  },
  {
    fixture: 'sdk-direct',
    rules: ['no-restricted-imports'],
    what: 'el SDK de la base importado directo, salteando lib/supabase/',
  },
  {
    fixture: 'literal-attr',
    rules: ['no-literal-visible-text'],
    what: 'un texto visible literal en un atributo o dentro de una expresión',
  },
  {
    fixture: 'use-client-entry',
    rules: ['no-use-client-in-route-entry'],
    what: '"use client" en la entrada de una ruta',
  },
  {
    fixture: 'explicit-any',
    rules: ['no-explicit-any'],
    what: 'un any explícito',
  },
  {
    fixture: 'test-rules',
    rules: ['expect-expect', 'no-disabled-tests', 'no-conditional-expect'],
    what: 'un test sin aserción, uno deshabilitado y uno con expect condicional',
  },
]

type Report = {
  /** Cuántos archivos miró oxlint. Cero significa que el fixture quedó excluido por accidente. */
  filesLinted: number
  /** El código de cada diagnóstico, como `adopciones(no-hex-color-in-component)`. */
  codes: string[]
}

// El binario de oxlint es un script de Node, así que se lo invoca con el mismo Node y sin shell:
// `pnpm exec` con shell escapa mal los argumentos en Windows y Node lo avisa (DEP0190).
const OXLINT_BIN = 'node_modules/oxlint/bin/oxlint'

function stdoutOf(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'stdout' in error &&
    typeof error.stdout === 'string'
  ) {
    return error.stdout
  }
  return ''
}

// Se valida en lugar de asertar: `JSON.parse` devuelve `any`, y una aserción acá esconde
// justamente el caso que importa, que oxlint no haya devuelto un reporte.
function parseReport(raw: string): Report {
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`oxlint no devolvió un objeto JSON: ${raw.slice(0, 200)}`)
  }
  const files = 'number_of_files' in parsed ? parsed.number_of_files : undefined
  const diagnostics = 'diagnostics' in parsed ? parsed.diagnostics : undefined
  if (typeof files !== 'number' || !Array.isArray(diagnostics)) {
    throw new Error(`el reporte de oxlint no tiene la forma esperada: ${raw.slice(0, 200)}`)
  }
  const codes = diagnostics.map((diagnostic: unknown) =>
    typeof diagnostic === 'object' &&
    diagnostic !== null &&
    'code' in diagnostic &&
    typeof diagnostic.code === 'string'
      ? diagnostic.code
      : '',
  )
  return { filesLinted: files, codes }
}

function lint(path: string): Report {
  try {
    return parseReport(
      execFileSync(process.execPath, [OXLINT_BIN, '--type-aware', '--format=json', path], {
        encoding: 'utf8',
      }),
    )
  } catch (error) {
    // oxlint sale distinto de 0 cuando encuentra algo: el reporte sigue estando en stdout.
    return parseReport(stdoutOf(error))
  }
}

describe('cada regla del repo se ve fallar', () => {
  for (const { fixture, rules, what } of CASES) {
    it(`falla con ${what}, y pasa corregido`, () => {
      const bad = lint(`tests/gates/fixtures/${fixture}/bad`)

      // Que haya archivos mirados: sin esto, un fixture excluido por accidente daría cero
      // diagnósticos y el test pasaría "en verde" sin haber demostrado nada.
      expect(bad.filesLinted).toBeGreaterThan(0)
      expect(bad.codes.length).toBeGreaterThan(0)
      for (const rule of rules) {
        expect(bad.codes.join(' ')).toContain(rule)
      }

      const good = lint(`tests/gates/fixtures/${fixture}/good`)
      expect(good.filesLinted).toBeGreaterThan(0)
      expect(good.codes).toEqual([])
    })
  }
})
