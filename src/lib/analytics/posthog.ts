import type { AnalyticsEvent } from './events'

type Capture = {
  key: string
  event: AnalyticsEvent
  props: object | undefined
  /** La marca de visita, o `sin-visita`: muere con el navegador y no es la cuenta. */
  visit: string
  /** `production` o `preview`: lo de una dirección de prueba no se cuenta con el sitio de verdad. */
  environment: string
  now: Date
}

// Sin perfil de persona (no une visitas) y sin ubicación (FR-021). Las propiedades del momento que
// empiezan con `$` son las que PostHog lee como la conexión, la dirección o la persona: no salen
// nunca, y ninguna del momento pisa a estas.
export function posthogEvent({ key, event, props, visit, environment, now }: Capture) {
  const moment = Object.entries(props ?? {}).filter(([name]) => !name.startsWith('$'))
  return {
    api_key: key,
    event,
    distinct_id: visit,
    timestamp: now.toISOString(),
    properties: {
      ...Object.fromEntries(moment),
      $process_person_profile: false,
      $geoip_disable: true,
      entorno: environment,
    },
  }
}
