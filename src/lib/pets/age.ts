import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'

export type AgeUnit = 'months' | 'years'
export type Age = { value: number; unit: AgeUnit }
/** La edad guardada y el día de Uruguay (`YYYY-MM-DD`) en que valía. */
export type StoredAge = Age & { asOf: string }

const DAY_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: URUGUAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function uruguayDay(now: Date): string {
  return DAY_FORMAT.format(now)
}

function parts(day: string): [number, number, number] {
  const [year, month, date] = day.split('-').map(Number)
  return [year, month, date]
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

// Un mes se cumple el mismo día del mes siguiente o, si ese mes no lo tiene, su último día
// (FR-010): del 31 de enero, el 28 de febrero ya es un mes.
export function monthsBetween(from: string, to: string): number {
  const [y1, m1, d1] = parts(from)
  const [y2, m2, d2] = parts(to)
  const months = (y2 - y1) * 12 + (m2 - m1)
  const anniversary = Math.min(d1, daysInMonth(y2, m2))
  return Math.max(0, d2 < anniversary ? months - 1 : months)
}

// Por debajo de 12 meses, en meses; desde 12, en años enteros hacia abajo. Sin tope: el rango de
// 1 a 25 limita lo que se carga, no lo que se muestra.
export function ageOn(stored: StoredAge, today: string): Age {
  const base = stored.unit === 'years' ? stored.value * 12 : stored.value
  const total = base + monthsBetween(stored.asOf, today)
  return total < 12
    ? { value: total, unit: 'months' }
    : { value: Math.floor(total / 12), unit: 'years' }
}

export type AgeDecision = { unchanged: true; age: StoredAge } | { unchanged: false }

type SaveInput = {
  /** La edad guardada al abrir la pantalla, tal como la mandó el formulario. */
  base: StoredAge
  /** La que se mostró al abrir. */
  shown: Age
  /** Lo que se manda ahora, sin validar. */
  submitted: { value: string; unit: string }
  /** Lo que la base tiene guardado hoy. */
  stored: StoredAge
  publishedOn: string
  today: string
}

// Se compara con lo que se mostró al abrir y no con la edad de hoy: un aniversario entre abrir y
// guardar no es un cambio (FR-010). La base que manda el cliente vale solo si es una edad que el
// animal tuvo desde que se publicó; si no, se toma la guardada.
export function resolveAgeOnSave(input: SaveInput): AgeDecision {
  const { base, shown, submitted, stored, publishedOn, today } = input
  const same = submitted.value.trim() === String(shown.value) && submitted.unit === shown.unit
  if (!same) return { unchanged: false }

  const baseIsValid = base.asOf >= publishedOn && base.asOf <= today
  return { unchanged: true, age: baseIsValid ? base : stored }
}
