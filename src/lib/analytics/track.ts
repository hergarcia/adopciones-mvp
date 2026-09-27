import { cookies } from 'next/headers'
import type { AnalyticsEvent } from './events'

export const VISIT_COOKIE = 'visit'

export type TrackProps = Record<string, string | number>

// La marca de visita: nace al abrir el sitio, viaja en una cookie de sesión de navegador —sin
// vencimiento, muere al cerrarlo— y nunca se guarda junto a la cuenta. Alcanza para ver en qué
// escalón se pierde la gente (FR-032a) sin poder volver nunca desde un evento a la persona que lo
// produjo, que es lo que pide FR-030c y lo que hace compatible la medición con SC-007. Las
// propiedades son planas y sin nada de la persona: ni nombres, ni textos, ni zona (FR-028).
export async function track(event: AnalyticsEvent, props: TrackProps = {}) {
  const visit = (await cookies()).get(VISIT_COOKIE)?.value ?? 'sin-visita'
  const extra = Object.entries(props)
    .map(([key, value]) => ` ${key}=${value}`)
    .join('')

  // Todavía no se manda a ninguna herramienta: el proyecto en la nube llega en M5 (decisión
  // 2026-09-19). Cuando llegue se cambia solo esta función y ningún punto de disparo se toca.
  console.info(`[medición] ${event} visita=${visit}${extra}`)
}
