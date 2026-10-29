import { z } from 'zod'
import { normalizeAlertFilters } from '@/lib/alerts/filters'
import { AGE_BAND_NAMES } from '@/lib/pets/listing-query'
import { SEXES, SIZES, SPECIES } from '@/lib/pets/options'
import { isDepartmentCode } from '@/lib/zones/departments'

const FAILED = 'alerts.errors.failed'

// Los seis filtros del listado en claves de dominio. Un valor que no existe no viene de la pantalla:
// no se ignora en silencio, el aviso no se crea (contracts §createPetAlert).
const filtersSchema = z
  .strictObject(
    {
      species: z.array(z.enum(SPECIES)),
      sex: z.array(z.enum(SEXES)),
      size: z.array(z.enum(SIZES)),
      age: z.array(z.enum(AGE_BAND_NAMES)),
      department: z.array(z.string().refine(isDepartmentCode)),
      neutered: z.array(z.literal('yes')),
    },
    { error: FAILED },
  )
  .transform(normalizeAlertFilters)

export const petAlertSchema = z.strictObject(
  { filters: filtersSchema, fromEmpty: z.boolean() },
  { error: FAILED },
)

export type PetAlertInput = z.infer<typeof petAlertSchema>
