import { z } from 'zod'

// Lo único que el navegador puede contar de una falla suya (research R10 vía 4): la ruta, para saber
// la pantalla, y el nombre del error (`TypeError`). Nunca el mensaje, que puede traer lo que la
// persona escribió. La acción es pública: sin espacios ni saltos en la ruta y solo letras en el
// nombre, nadie mete texto libre en el registro.
export const clientFailureSchema = z.strictObject({
  path: z
    .string()
    .max(200)
    .regex(/^\/\S*$/u),
  name: z.string().regex(/^[a-z]{1,40}$/iu),
})

export type ClientFailure = z.infer<typeof clientFailureSchema>
