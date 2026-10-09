export type OptionCount<O extends string = string> = { option: O; chosen: number }

export type OptionBar<O extends string = string> = OptionCount<O> & {
  /** La parte de las respuestas del momento, de 0 a 1: el largo de la barra. */
  share: number
  /** La más elegida, en tinta llena; en un empate, todas las que empatan. */
  isTop: boolean
}

// Las barras de Encuestas (plan §Diseño Encuestas): cada opción mide su parte de las respuestas, así
// la barra dice lo que dice el número. Sin respuestas no hay ninguna más elegida.
export function optionBars<O extends string>(counts: readonly OptionCount<O>[]): OptionBar<O>[] {
  const total = counts.reduce((sum, count) => sum + count.chosen, 0)
  const top = Math.max(0, ...counts.map((count) => count.chosen))
  return counts.map((count) => ({
    ...count,
    share: total === 0 ? 0 : count.chosen / total,
    isTop: top > 0 && count.chosen === top,
  }))
}
