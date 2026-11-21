import { z } from 'zod'
import { FOUND_VIA_OPTIONS } from '@/lib/adoptions/found-via'

// Marcar adoptado: a una persona con la solicitud aceptada, o `null` para «por fuera del sitio»
// (FR-001, FR-003). Que sea suya y siga aceptada lo decide la base con el candado (research R3).
// `foundVia` es «¿Por dónde te encontró?» (#254): null si no eligió; con una persona no se cuenta.
export const handoverSchema = z.strictObject({
  petId: z.uuid(),
  applicationId: z.uuid().nullable(),
  attemptId: z.uuid(),
  foundVia: z.enum(FOUND_VIA_OPTIONS).nullable(),
})

export type HandoverInput = z.infer<typeof handoverSchema>

// Aceptar el compromiso o decir «Yo no adopté»: solo la solicitud; que sea de quien toca lo decide la
// base con el id de la sesión (research R5).
export const commitmentActionSchema = z.strictObject({ applicationId: z.uuid() })

export type CommitmentActionInput = z.infer<typeof commitmentActionSchema>
