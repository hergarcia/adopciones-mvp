import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'

/** «3 de octubre»: el día de un momento guardado, en la hora de Uruguay. */
export function momentDayLabel(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: URUGUAY_TIME_ZONE,
  }).format(new Date(iso))
}
