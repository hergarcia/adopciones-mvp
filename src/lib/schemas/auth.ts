import { z } from 'zod'

// Un correo mal escrito no manda nada (FR-002): el rechazo ocurre antes de tocar el servicio.
// Se recorta primero porque un teclado de teléfono agrega un espacio al final bastante seguido, y
// eso no es un error de la persona.
export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'auth.errors.email_required')
    .pipe(z.email('auth.errors.email_format'))
    .pipe(z.string().max(254, 'auth.errors.email_format'))
    .transform((value) => value.toLocaleLowerCase('en')),
})

export type EmailInput = z.infer<typeof emailSchema>
