import { z } from 'zod'

// Marcar adoptado: a una persona con la solicitud aceptada, o `null` para «por fuera del sitio»
// (FR-001, FR-003). Que sea suya y siga aceptada lo decide la base con el candado (research R3).
export const handoverSchema = z.strictObject({
  petId: z.uuid(),
  applicationId: z.uuid().nullable(),
  attemptId: z.uuid(),
})

export type HandoverInput = z.infer<typeof handoverSchema>
