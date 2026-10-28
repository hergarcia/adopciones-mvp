import {
  EXIT_LEVELS,
  EXIT_OPTIONS,
  EXIT_ORIGINS,
  type ExitLevel,
  type ExitOption,
  type ExitOrigin,
} from '@/lib/verification/exit-question'

/** Una fila de `admin_verification_exit_summary`: las cuentas de (nivel, origen) con una opción. */
export type ExitSummaryRow = {
  level: ExitLevel
  origin: ExitOrigin
  asked: number
  skipped: number
  option: ExitOption
  chosen: number
}

export type ExitOptionCount = {
  option: ExitOption
  total: number
  byOrigin: Record<ExitOrigin, number>
}

/** Un bloque de «Por qué no se verificaron»: las cuentas del nivel y sus cinco opciones. */
export type ExitLevelSummary = {
  level: ExitLevel
  asked: number
  answered: number
  skipped: number
  options: ExitOptionCount[]
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

// La base repite las cuentas de (nivel, origen) en cada una de sus opciones: se toman una vez por
// origen. Los dos niveles salen siempre, en su orden y con sus opciones en el orden en que se
// ofrecen, aunque la base no haya devuelto nada de alguno.
export function exitSummaryBlocks(rows: readonly ExitSummaryRow[]): ExitLevelSummary[] {
  return EXIT_LEVELS.map((level) => {
    const own = rows.filter((row) => row.level === level)
    const perOrigin = EXIT_ORIGINS.map((origin) => own.find((row) => row.origin === origin))
    const options = EXIT_OPTIONS[level].map((option) => {
      const chosen = (origin: ExitOrigin) =>
        own.find((row) => row.origin === origin && row.option === option)?.chosen ?? 0
      const byOrigin = { publish: chosen('publish'), apply: chosen('apply'), self: chosen('self') }
      return { option, total: sum(Object.values(byOrigin)), byOrigin }
    })
    return {
      level,
      asked: sum(perOrigin.map((row) => row?.asked ?? 0)),
      answered: sum(options.map((option) => option.total)),
      skipped: sum(perOrigin.map((row) => row?.skipped ?? 0)),
      options,
    }
  })
}
