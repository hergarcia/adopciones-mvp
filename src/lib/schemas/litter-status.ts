import { z } from 'zod'
import { YOUNG_MAX } from '@/lib/litters/rules'
import { YOUNG_DB_ACTIONS } from '@/lib/litters/types'

// Una acción sobre una cría: cuál y sobre quién. Que sea de quien publicó y que corresponda al estado
// de la cría y de su camada lo decide la base con el candado (research R4).
export const youngStatusChangeSchema = z.strictObject({
  petId: z.uuid(),
  action: z.enum(YOUNG_DB_ACTIONS),
})

export type YoungStatusChange = z.infer<typeof youngStatusChangeSchema>

// Una acción sobre la camada entera. Solo volver a publicar elige crías: las de una adoptada que
// vuelven a ofrecerse (FR-006), al menos una y no más de las que tiene una camada.
export const litterStatusChangeSchema = z.union([
  z.strictObject({
    litterId: z.uuid(),
    action: z.enum(['pause', 'resume', 'renew']),
  }),
  z.strictObject({
    litterId: z.uuid(),
    action: z.literal('republish'),
    youngIds: z.array(z.uuid()).min(1).max(YOUNG_MAX).optional(),
  }),
])

export type LitterStatusChange = z.infer<typeof litterStatusChangeSchema>
