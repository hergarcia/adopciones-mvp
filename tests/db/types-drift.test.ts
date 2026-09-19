// Los tipos generados tienen que ser idénticos a los versionados, y eso es una compuerta y no una
// línea de prosa (FR-021). Genera a memoria y compara: no reescribe el archivo versionado, porque
// eso ensuciaría el árbol y el diff con el que scripts/mutation.mjs decide qué mutar.
//
// Los finales de línea se normalizan de los dos lados: en Windows la salida del CLI trae CRLF y el
// archivo versionado es LF, así que una comparación cruda fallaría solo en una plataforma.
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { generate } from '../../scripts/db-types.mjs'
import { describeDb } from '../setup/env-report'

const VERSIONED = 'src/lib/supabase/types.ts'

const normalise = (text: string) => text.replaceAll('\r\n', '\n').trimEnd()

describeDb('los tipos generados no derivaron', () => {
  it('coinciden con los versionados', () => {
    expect(normalise(generate())).toBe(normalise(readFileSync(VERSIONED, 'utf8')))
  })
})
