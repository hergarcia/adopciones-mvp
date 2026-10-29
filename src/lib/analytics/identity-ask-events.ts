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
