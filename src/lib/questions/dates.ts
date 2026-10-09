import { lostDayLabel } from '@/lib/verification/lost-notice'

/** El día anotado en el registro, `YYYY-MM-DD`, o lanza: una fecha mal escrita no se publica. */
export function parseDay(day: string): Date {
  const date = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day) {
    throw new RangeError(`Día inválido: ${day}`)
  }
  return date
}

// En UTC de punta a punta, como el día de un aviso: el anotado, esté el servidor en la zona que esté
// (research R13).
export function formatUpdatedOn(day: string, locale: string): string {
  parseDay(day)
  return lostDayLabel(day, locale)
}
