// Una clave de texto que no existe tiene que fallar `typecheck`, no aparecer cruda en pantalla
// (FR-029). Esta compuerta existe porque ya se dio por buena una vez sin verla fallar: next-intl 4
// ignora el `IntlMessages` global que se había declarado, y todo seguía en verde.
//
// Corre el `tsc` del proyecto con el tsconfig real (los de los ejemplos lo extienden), así que si
// alguien rompe la declaración de src/types/i18n.d.ts, esto se pone rojo.
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const TSC = 'node_modules/typescript/bin/tsc'
const FIXTURES = 'tests/gates/fixtures/typed-keys'

function typecheck(which: 'bad' | 'good') {
  const result = spawnSync(process.execPath, [TSC, '-p', `${FIXTURES}/tsconfig.${which}.json`], {
    encoding: 'utf8',
  })
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

describe('las claves de texto están tipadas', () => {
  it('una clave que no existe en messages/es.json falla typecheck nombrándola', () => {
    const bad = typecheck('bad')
    expect(bad.status).not.toBe(0)
    expect(bad.output).toContain('esta_clave_no_existe')
  })

  it('una clave que existe pasa', () => {
    const good = typecheck('good')
    expect(good.output).toBe('')
    expect(good.status).toBe(0)
  })
})
