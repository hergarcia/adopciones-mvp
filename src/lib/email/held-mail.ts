// Lo que los correos de resultado de la identidad cuentan de las solicitudes que esperaban (historia
// #289, research R9): un párrafo por cosa, debajo del cuerpo de siempre. Sin ninguna, nada (FR-035).
// Nunca las respuestas (FR-036).

export const HELD_MAIL_OUTCOMES = ['released', 'waiting', 'lapsed'] as const
export type HeldMailOutcome = (typeof HELD_MAIL_OUTCOMES)[number]

/** Una que esperaba: el nombre del animal, qué le pasó y, si sigue esperando, su último día. */
export type HeldMailLine = { name: string; outcome: HeldMailOutcome; until: string | null }

type HeldMailKey = 'held_released' | 'held_waiting' | 'held_waiting_phone' | 'held_capped'

/** Cada correo pasa sus textos; cada función pide solo las claves que usa. */
export type HeldMailTexts<Key extends HeldMailKey = HeldMailKey> = (
  key: Key,
  values: { count?: number; names?: string; name?: string; date?: string },
) => string

export type HeldMailFormat = {
  /** «16 de noviembre», del día del calendario `YYYY-MM-DD`. */
  day: (value: string) => string
  /** «Tobi y Pipo». */
  list: (names: string[]) => string
}

// Aprobada: las que salieron van juntas en un párrafo; cada una que sigue esperando dice hasta qué
// día. Sin el teléfono vigente es lo único que falta; con nivel 2, lo que falta es que el animal
// vuelva a recibir. Una que justo venció en la aprobación no se nombra: no salir no avisa (FR-032).
export function heldApprovedParagraphs(
  held: HeldMailLine[],
  levelTwoNow: boolean,
  t: HeldMailTexts<'held_released' | 'held_waiting' | 'held_waiting_phone'>,
  format: HeldMailFormat,
): string[] {
  const released = held.filter((line) => line.outcome === 'released').map((line) => line.name)
  const waiting = held.flatMap((line) =>
    line.outcome === 'waiting' && line.until !== null
      ? [
          t(levelTwoNow ? 'held_waiting' : 'held_waiting_phone', {
            name: line.name,
            date: format.day(line.until),
          }),
        ]
      : [],
  )
  return released.length === 0
    ? waiting
    : [t('held_released', { count: released.length, names: format.list(released) }), ...waiting]
}

// Rechazada o vencida: cada una que sigue esperando dice hasta qué día puede mandar las fotos de nuevo
// para que salga (FR-034).
export function heldUntilParagraphs(
  held: HeldMailLine[],
  t: HeldMailTexts<'held_waiting'>,
  format: HeldMailFormat,
): string[] {
  return held.flatMap((line) =>
    line.outcome === 'waiting' && line.until !== null
      ? [t('held_waiting', { name: line.name, date: format.day(line.until) })]
      : [],
  )
}

// El rechazo que llega al tope ya las cerró a todas: van juntas, con que no van a salir (FR-034).
export function heldCappedParagraphs(
  held: HeldMailLine[],
  t: HeldMailTexts<'held_capped'>,
  format: HeldMailFormat,
): string[] {
  const lapsed = held.filter((line) => line.outcome === 'lapsed').map((line) => line.name)
  return lapsed.length === 0
    ? []
    : [t('held_capped', { count: lapsed.length, names: format.list(lapsed) })]
}
