import type { PhoneRow } from './phone-status'

// «Mi perfil» dice que el número se perdió mientras la cuenta guarda el día y no tiene otro
// verificado (FR-011a, FR-011b). La base ya no deja las dos cosas juntas; esto no lo supone.
export function lostNotice(row: PhoneRow | null): { lostOn: string } | null {
  if (!row?.numberLostOn || row.verifiedNumber !== null) return null
  return { lostOn: row.numberLostOn }
}

// El día es un día de calendario, no un instante: formateado como instante en la zona de Uruguay,
// la medianoche UTC de ese día caería en el anterior. El correo y el perfil usan esta misma
// función, así dicen el mismo día (FR-011a).
export function lostDayLabel(day: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00Z`),
  )
}
