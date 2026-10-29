import type { DeletionAnswer, DeletionKind } from '@/lib/pets/deletion-reason'
import type { TrackedEvent } from './events'

// Lo que se mide de «¿Por qué lo borrás?» (historia #263, research R7): si era un animal o una
// camada y la respuesta. Nunca el animal, la persona ni el día, como el resto de la medición.
export function deletionReasonEvent(kind: DeletionKind, reason: DeletionAnswer): TrackedEvent {
  return { name: 'pet_deletion_reason', props: { kind, reason } }
}
