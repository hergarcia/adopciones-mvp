import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'

/** «3 de octubre»: el día de un momento guardado, en la hora de Uruguay. */
export function momentDayLabel(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: URUGUAY_TIME_ZONE,
  }).format(new Date(iso))
}

/**
 * «3 de octubre»: un día de calendario guardado sin hora, como el de una opinión o una respuesta. Se
 * formatea en UTC: en la zona de Uruguay, la medianoche UTC de ese día caería en el anterior.
 */
export function calendarDayLabel(day: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00Z`),
  )
}
