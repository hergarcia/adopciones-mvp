import { cookies } from 'next/headers'
import type { AnalyticsEvent, EventProps } from './events'

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
  const visit =
    options?.visit === false
      ? 'sin-visita'
      : ((await cookies()).get(VISIT_COOKIE)?.value ?? 'sin-visita')
  const details = props === undefined ? '' : ` ${JSON.stringify(props)}`

  // Todavía no se manda a ninguna herramienta: el proyecto en la nube llega en M5 (decisión
  // 2026-09-19). Cuando llegue se cambia solo esta función y ningún punto de disparo se toca.
  console.info(`[medición] ${event}${details} visita=${visit}`)
}
