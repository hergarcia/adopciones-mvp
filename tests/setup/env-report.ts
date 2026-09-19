// Arranque por archivo: decide cómo se comporta una suite que necesita la base. El aviso y el
// registro de la omisión los hace global-notice.ts, una sola vez.
//
// No lanza: si lanzara, una base ausente haría fallar también las suites que no la necesitan, como
// la demostración de las compuertas.
import { describe, it } from 'vitest'
import { probeDatabase } from './database'

const { up, why } = await probeDatabase()

export const databaseUp = up

// En CI, una suite que necesita la base no se omite: se planta y dice por qué (docs/09).
function describeMissingDatabase(name: string, _define: () => void): void {
  describe(name, () => {
    it('necesita la base local, y en CI eso no se omite', () => {
      throw new Error(`${why} Un salteo silencioso en CI está prohibido (docs/09).`)
    })
  })
}

// Una suite que necesita la base: corre si está, se omite con aviso en la máquina si no está, y
// falla en CI. Se elige la función una sola vez, en lugar de ramificar en cada suite.
export const describeDb: (name: string, define: () => void) => void = databaseUp
  ? describe
  : process.env.CI
    ? describeMissingDatabase
    : describe.skip
