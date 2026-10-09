import { z } from 'zod'
import { NAME_MAX } from './profile'

/** Cuántas personas muestra una búsqueda; la base trae una más para saber si hay más (FR-054). */
export const ADMIN_SEARCH_LIMIT = 20

/** Las letras que hacen falta para buscar, sin contar los espacios (FR-051). */
export const ADMIN_SEARCH_MIN = 3

const TOO_SHORT = 'admin.search.errors.too_short'

// Buscar a una persona por nombre (research R6): la misma regla que la base, para no llamarla con
// menos de 3 letras. Más largo que el nombre más largo posible no encuentra a nadie. Se cuentan
// puntos de código, como `char_length` en la base.
export const adminSearchSchema = z
  .strictObject({ query: z.string({ message: TOO_SHORT }) })
  .transform(({ query }) => ({ query: query.trim().replaceAll(/\s+/gu, ' ') }))
  .superRefine(({ query }, ctx) => {
    // oxlint-disable-next-line typescript/no-misused-spread -- puntos de código a propósito
    const letters = [...query.replaceAll(' ', '')].length
    // oxlint-disable-next-line typescript/no-misused-spread -- puntos de código, como arriba
    const length = [...query].length
    const message =
      letters < ADMIN_SEARCH_MIN
        ? TOO_SHORT
        : length > NAME_MAX
          ? 'admin.search.errors.too_long'
          : null
    if (message === null) return
    ctx.addIssue({
      // Stryker disable next-line StringLiteral: equivalente — el tipo lo exige, pero quien lee el error mira solo `message` y `path`
      code: 'custom',
      message,
      path: ['query'],
    })
  })

export type AdminSearchInput = z.input<typeof adminSearchSchema>
