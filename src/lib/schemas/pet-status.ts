import { z } from 'zod'
import { PET_STATUS_ACTIONS } from '@/lib/pets/types'

// Una acción de «Mis animales» sobre un animal: cuál y sobre quién. Que sea del publicador y que
// corresponda a su estado lo decide la base con el candado (research R2).
export const petStatusChangeSchema = z.strictObject({
  petId: z.uuid(),
  action: z.enum(PET_STATUS_ACTIONS),
})

export type PetStatusChange = z.infer<typeof petStatusChangeSchema>

export const petDeletionSchema = z.strictObject({ petId: z.uuid() })
