import { cookies } from 'next/headers'
import type { AnalyticsEvent, EventProps } from './events'

export const VISIT_COOKIE = 'visit'

// La marca de visita: nace al abrir el sitio, viaja en una cookie de sesión de navegador —sin
// vencimiento, muere al cerrarlo— y nunca se guarda junto a la cuenta. Alcanza para ver en qué
// escalón se pierde la gente (FR-032a) sin poder volver nunca desde un evento a la persona que lo
// produjo, que es lo que pide FR-030c y lo que hace compatible la medición con SC-007.
export async function track<E extends AnalyticsEvent>(event: E, props?: EventProps<E>) {
  const visit = (await cookies()).get(VISIT_COOKIE)?.value ?? 'sin-visita'
  const extra = props === undefined ? '' : ` ${formatProps(props)}`

  // Todavía no se manda a ninguna herramienta: el proyecto en la nube llega en M5 (decisión
  // 2026-09-19). Cuando llegue se cambia solo esta función y ningún punto de disparo se toca.
  console.info(`[medición] ${event} visita=${visit}${extra}`)
}

function formatProps(props: Record<string, string | boolean>): string {
  return Object.entries(props)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' ')
}
