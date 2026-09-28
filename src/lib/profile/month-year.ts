// «agosto de 2026» desde el primer día del mes que manda la base, que ya es de Uruguay (research
// R8). En UTC, porque la medianoche de ese día leída en la zona del proceso podría caer en el mes
// anterior.
const FORMAT = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function monthYear(day: string): string {
  return FORMAT.format(new Date(`${day}T00:00:00Z`))
}
