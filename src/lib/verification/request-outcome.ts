import type { ActionResult } from '@/actions/result'
import type { AnalyticsEvent } from '@/lib/analytics/events'
import { retryDisplay, type RetryDisplay } from './retry-at'

export type ReserveDecision = 'same_number' | 'wait' | 'daily_cap' | 'site_cap' | 'skip' | 'send'

export type Reserved = {
  decision: ReserveDecision
  retryAt: Date | null
  reachedCap: boolean
  reachedSiteCap: boolean
}

/** Qué pasó con el mensaje de un `send`. `settle_failed`: salió, pero no se pudo anotar. */
export type Delivery = 'sent' | 'rejected' | 'failed' | 'settle_failed'

export type RequestResult = ActionResult<
  { number: string; next: RetryDisplay },
  { retry?: RetryDisplay }
>

type Input = {
  reserved: Reserved
  /** Solo con `send`: el resultado de mandar el mensaje y cerrar la entrega. */
  delivery: Delivery | null
  /** El número, ya en formato de pantalla. */
  number: string
  /** Cuándo se puede pedir el siguiente, leído después de anotar este. */
  nextAt: Date | null
  now: Date
  format: { timeZone: string; locale: string }
}

// De lo que decidió la base y lo que pasó con el mensaje, a lo que ve la persona y lo que se mide.
// La regla que importa: un pedido frenado en silencio por el tope por número responde **exactamente
// igual** que uno que salió (FR-006a, FR-011). Los eventos no vuelven al cliente, así que su
// diferencia no sale del servidor (FR-024).
export function requestOutcome(input: Input): { result: RequestResult; events: AnalyticsEvent[] } {
  const { reserved } = input
  const display = (at: Date | null) => retryDisplay(at, input.now, input.format)
  const accepted: RequestResult = {
    ok: true,
    data: { number: input.number, next: display(input.nextAt) },
  }
  // El tope se registra al llegar a él, con el pedido que lo alcanzó y siempre que ese pedido haya
  // contado; el techo, solo si el pedido contó para el techo (FR-024).
  const capEvents = (countsForSite: boolean): AnalyticsEvent[] => [
    ...(reserved.reachedCap ? (['phone_code_cap_reached'] as const) : []),
    ...(reserved.reachedSiteCap && countsForSite ? (['phone_site_cap_reached'] as const) : []),
  ]

  switch (reserved.decision) {
    case 'same_number':
      return { result: refused('verification.errors.same_number'), events: [] }
    case 'wait':
    case 'daily_cap':
    case 'site_cap':
      return {
        result: {
          ok: false,
          error: `verification.errors.${reserved.decision}`,
          detail: { retry: display(reserved.retryAt) },
        },
        events: [],
      }
    case 'skip':
      return { result: accepted, events: capEvents(true) }
    default:
      return afterSending(input.delivery, accepted, display(input.nextAt), capEvents)
  }
}

function afterSending(
  delivery: Delivery | null,
  accepted: RequestResult,
  next: RetryDisplay,
  capEvents: (countsForSite: boolean) => AnalyticsEvent[],
): { result: RequestResult; events: AnalyticsEvent[] } {
  switch (delivery) {
    case 'sent':
      return { result: accepted, events: ['phone_code_requested', ...capEvents(true)] }
    // Un número que no recibe mensajes es un error de lo escrito: cuenta para la persona, pero no
    // mandó nada y no cuenta para el techo (FR-002a). Como contó, dice cuándo pedir otro (FR-010a).
    case 'rejected':
      return {
        result: {
          ok: false,
          error: 'verification.errors.number_unreachable',
          detail: { retry: next },
        },
        events: capEvents(false),
      }
    // El mensaje salió y no se pudo anotar: no se puede decir que no salió ni que sirve (FR-009e).
    case 'settle_failed':
      return { result: refused('verification.errors.request_unknown'), events: [] }
    default:
      return { result: refused('verification.errors.send_failed'), events: [] }
  }
}

function refused(error: string): RequestResult {
  return { ok: false, error }
}
