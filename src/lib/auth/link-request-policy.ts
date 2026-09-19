import { MIN_SECONDS_BETWEEN_REQUESTS, type WindowDecision } from './request-window'

// El tope que protege el buzón ajeno: como mucho diez correos por hora a la misma dirección, para
// que nadie se lo llene a otro. Es alto a propósito, contra los cinco por navegador que una
// persona real sí puede alcanzar, y es **mudo**: al pasarse, el correo no sale y la pantalla es
// exactamente la misma de siempre (FR-006, FR-006c).
export const MAX_EMAILS_PER_ADDRESS_PER_HOUR = 10

export type LinkRequestPlan =
  { outcome: 'wait'; waitSeconds: number } | { outcome: 'accepted'; send: boolean }

export function planLinkRequest(input: {
  window: WindowDecision
  emailsToAddressInLastHour: number
}): LinkRequestPlan {
  if (!input.window.allowed) {
    return { outcome: 'wait', waitSeconds: input.window.waitSeconds }
  }

  return {
    outcome: 'accepted',
    send: input.emailsToAddressInLastHour < MAX_EMAILS_PER_ADDRESS_PER_HOUR,
  }
}

// Lo único que sale a la pantalla. Deriva del plan y **nunca** de `send`: si mirara si el correo
// salió, escribir la dirección de otra persona diría si esa dirección recibió correos hace poco,
// que es exactamente el oráculo que FR-006a prohíbe. Por eso `send` no aparece acá.
export function visibleResult(plan: LinkRequestPlan): { waitSeconds: number } {
  return {
    waitSeconds: plan.outcome === 'wait' ? plan.waitSeconds : MIN_SECONDS_BETWEEN_REQUESTS,
  }
}
