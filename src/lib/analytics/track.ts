import { cookies } from 'next/headers'
import type { AnalyticsEvent, EventProps, TrackedEvent } from './events'

export const VISIT_COOKIE = 'visit'

type TrackOptions = {
  /**
   * `false` para los momentos que no son de la visita de quien mira: los de quien administra y el
   * vencimiento (FR-035). Sin la marca, no se pueden unir a los pasos de la persona.
   */
  visit?: boolean
}

type Rest<E extends AnalyticsEvent> = E extends keyof EventProps
  ? [props: EventProps[E], options?: TrackOptions]
  : [props?: undefined, options?: TrackOptions]

// La marca de visita: nace al abrir el sitio, viaja en una cookie de sesión de navegador —sin
// vencimiento, muere al cerrarlo— y nunca se guarda junto a la cuenta. Alcanza para ver en qué
// escalón se pierde la gente (FR-032a) sin poder volver nunca desde un evento a la persona que lo
// produjo, que es lo que pide FR-030c y lo que hace compatible la medición con SC-007.
export async function track<E extends AnalyticsEvent>(event: E, ...[props, options]: Rest<E>) {
  await record(event, props, options)
}

// Para la lista que arma una regla pura antes de mandarla: el tipo de cada elemento ya ata el evento
// a sus propiedades, cosa que `track` no puede comprobar con un nombre que es una unión.
export async function trackAll(events: TrackedEvent[]) {
  await Promise.all(events.map((event) => record(event.name, event.props)))
}

async function record(event: AnalyticsEvent, props: object | undefined, options?: TrackOptions) {
  const visit =
    options?.visit === false
      ? 'sin-visita'
      : ((await cookies()).get(VISIT_COOKIE)?.value ?? 'sin-visita')
  const details = props === undefined ? '' : ` ${JSON.stringify(props)}`

  // Todavía no se manda a ninguna herramienta: el proyecto en la nube llega en M5 (decisión
  // 2026-09-19). Cuando llegue se cambia solo esta función y ningún punto de disparo se toca.
  console.info(`[medición] ${event}${details} visita=${visit}`)
}
