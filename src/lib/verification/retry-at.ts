import { inSeconds } from '@/lib/i18n/plural'

export type RetryDisplay =
  | { kind: 'now' }
  | { kind: 'seconds'; seconds: number }
  | {
      kind: 'at'
      day: 'today' | 'tomorrow' | 'weekday'
      weekday: string
      time: string
      seconds: number
    }

const SHOW_SECONDS_BELOW = 120

// Qué decirle a la persona sobre cuándo puede pedir otro código (FR-010a). Se decide en el
// servidor con la zona pasada a mano, así el navegador nunca convierte la hora a la suya, y
// `seconds` viaja siempre para que el botón se habilite contando desde que llegó la página y no
// desde el reloj del teléfono, que puede estar corrido.
export function retryDisplay(
  at: Date | null,
  now: Date,
  options: { timeZone: string; locale: string },
): RetryDisplay {
  if (at === null) return { kind: 'now' }
  const seconds = Math.ceil((at.getTime() - now.getTime()) / 1000)
  if (seconds <= 0) return { kind: 'now' }
  if (seconds < SHOW_SECONDS_BELOW) return { kind: 'seconds', seconds }

  const days = calendarDaysBetween(now, at, options.timeZone)
  return {
    kind: 'at',
    day: days === 0 ? 'today' : days === 1 ? 'tomorrow' : 'weekday',
    weekday: new Intl.DateTimeFormat(options.locale, {
      timeZone: options.timeZone,
      weekday: 'long',
    }).format(at),
    time: new Intl.DateTimeFormat(options.locale, {
      timeZone: options.timeZone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(at),
    seconds,
  }
}

// Días de calendario en esa zona, no bloques de 24 horas: las 23:59 y las 00:01 son "mañana".
function calendarDaysBetween(from: Date, to: Date, timeZone: string): number {
  return (dayNumber(to, timeZone) - dayNumber(from, timeZone)) / 86_400_000
}

// El día de calendario de esa fecha en esa zona, como la medianoche UTC de ese día: en-CA escribe
// las fechas como AAAA-MM-DD, que es justo lo que `Date.parse` entiende.
function dayNumber(date: Date, timeZone: string): number {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return Date.parse(`${day}T00:00:00Z`)
}

/** Los textos de la línea "podés pedir otro…", ya traducidos, con sus lugares para completar. */
export type RetryTexts = {
  secondsOne: string
  secondsMany: string
  today: string
  tomorrow: string
  weekday: string
}

/** Cuántos segundos faltan para poder pedir, que es de donde arranca la cuenta regresiva. */
export function secondsUntil(display: RetryDisplay): number {
  return display.kind === 'now' ? 0 : display.seconds
}

// Qué decir mientras corre la cuenta. Con una hora lejana se dice la hora y no los segundos, que
// serían miles; cuando faltan menos de dos minutos, se pasa a contarlos.
export function retryText(
  display: RetryDisplay,
  secondsLeft: number,
  texts: RetryTexts,
): string | null {
  if (secondsLeft <= 0) return null
  if (display.kind === 'at' && secondsLeft >= SHOW_SECONDS_BELOW) {
    return texts[display.day].replace('{time}', display.time).replace('{weekday}', display.weekday)
  }
  return inSeconds(secondsLeft, { one: texts.secondsOne, many: texts.secondsMany })
}
