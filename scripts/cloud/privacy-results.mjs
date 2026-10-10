// Del informe JSON de Vitest al resultado de cada regla: pasó, falló o no corrió (FR-051). Una prueba
// omitida cuenta como no corrida: el arnés omite las de la base cuando no la encuentra.
import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'

export const pathOf = (name) => `tests/db/${name}.test.ts`

/** Por archivo (`identity` por `tests/db/identity.test.ts`): cuántas pasaron, cuáles fallaron, cuántas se omitieron. */
export function outcomesByFile(report) {
  if (!existsSync(report)) return new Map()
  const { testResults } = JSON.parse(readFileSync(report, 'utf8'))
  return new Map(
    testResults.map(({ name, status, message, assertionResults }) => {
      const failed = assertionResults.filter((test) => test.status === 'failed')
      const passed = assertionResults.filter((test) => test.status === 'passed').length
      const broken = status === 'failed' && failed.length === 0 ? [message || 'no cargó'] : []
      return [
        basename(name, '.test.ts'),
        {
          passed,
          failed: [...broken, ...failed.map((test) => test.fullName)],
          skipped: assertionResults.length - passed - failed.length,
        },
      ]
    }),
  )
}

/** El resultado de una regla y su detalle, a partir de los archivos que la prueban. */
export function judge(files, byFile) {
  const ran = files.map((name) => byFile.get(name))
  const failed = ran.flatMap((file) => file?.failed ?? [])
  const passed = ran.reduce((sum, file) => sum + (file?.passed ?? 0), 0)
  const skipped = ran.reduce((sum, file) => sum + (file?.skipped ?? 0), 0)
  const missing = files.filter((_, i) => !ran[i] || ran[i].passed + ran[i].failed.length === 0)
  if (failed.length > 0) {
    return ['falló', `${failed.length} de ${passed + failed.length}: ${failed.join('; ')}`]
  }
  if (missing.length > 0) return ['no corrió', `sin resultado: ${missing.map(pathOf).join(', ')}`]
  if (skipped > 0) return ['no corrió', `${skipped} omitidas, ${passed} pasaron`]
  return ['pasó', passed === 1 ? '1 prueba' : `${passed} pruebas`]
}
