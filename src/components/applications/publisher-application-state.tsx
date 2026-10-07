import type { ApplicationTone } from '@/lib/applications/application-view'
import { ApplicationStamp } from './application-stamp'

type Props = {
  tone: ApplicationTone
  /**
   * Ya traducidos: el sello, desde cuándo («desde hace 4 días», «el 7 de octubre») o nada, por qué
   * se cerró o nada, y «Llegó el 3 de octubre por Tobi».
   */
  texts: { stamp: string; since: string | null; close: string | null; arrived: string }
}

// Debajo de quién es, en una solicitud para el publicador: el sello del estado con desde cuándo, la
// línea de por qué se cerró —una sola para retiro, bloqueo y suspensión de quien la mandó (FR-042)—
// y cuándo llegó.
export function PublisherApplicationState({ tone, texts }: Props) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ApplicationStamp tone={tone} label={texts.stamp} />
        {texts.since === null ? null : (
          <span className="text-sm text-ink-muted tabular-nums">{texts.since}</span>
        )}
      </div>
      {texts.close === null ? null : <p className="text-base text-ink">{texts.close}</p>}
      <p className="text-sm text-ink-muted tabular-nums">{texts.arrived}</p>
    </div>
  )
}
