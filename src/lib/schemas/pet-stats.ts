import { z } from 'zod'

// Qué números pide «Cómo le va a…»: los de un animal publicado solo o los de una camada
// (contracts §readPetStats).
export const petStatsRequestSchema = z.strictObject({
  kind: z.enum(['pet', 'litter']),
  id: z.uuid(),
})

export type PetStatsRequest = z.infer<typeof petStatsRequestSchema>
