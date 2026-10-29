import type { TrackedEvent } from './events'
import { publisherLevelProps, type MeasuredLevel } from './measured-levels'

// Los momentos del pedido de identidad (historia #257, research R9): el nivel de quien pidió y la
// marca de camada, nunca quién, qué animal ni qué solicitud (FR-036).

export function identityAskSentEvent(sent: {
  litter: boolean
  publisherLevel: MeasuredLevel | null
}): TrackedEvent {
  return {
    name: 'identity_ask_sent',
    props: { litter: sent.litter, ...publisherLevelProps(sent.publisherLevel) },
  }
}

/** Uno por pedido que resolvió la aprobación, con el nivel de quien lo pidió (FR-034). */
export function identityAskResolvedEvents(askerLevels: (MeasuredLevel | null)[]): TrackedEvent[] {
  return askerLevels.map((level) => ({
    name: 'identity_ask_resolved',
    props: publisherLevelProps(level),
  }))
}
