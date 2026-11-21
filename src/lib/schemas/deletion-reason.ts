import { z } from 'zod'
import { DELETION_ANSWERS } from '@/lib/pets/deletion-reason'

// Lo que manda la confirmación de borrar. Sin la propiedad: la confirmación no mostró la pregunta,
// y no se cuenta nada (contracts §deletePet).
export const deletionAnswerSchema = z.enum(DELETION_ANSWERS).optional()
