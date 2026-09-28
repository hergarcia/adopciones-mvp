import type { StoredAge } from '@/lib/pets/age'
import { isOneOf } from '@/lib/pets/options'
import type { Zone } from '@/lib/pets/types'
import { isDepartmentCode } from '@/lib/zones/departments'

// Lo que comparten las lecturas de animales para pasar una fila de la base al dominio.

// Los checks de la migración ya garantizan los valores; la guarda convierte esa garantía en algo
// que el compilador ve, sin castear.
export function oneOf<T extends string>(options: readonly T[], value: string, what: string): T {
  if (!isOneOf(options, value)) throw new Error(`${what} fuera de la lista: ${value}`)
  return value
}

export function zoneOf(row: { department: string; locality: string }): Zone {
  if (!isDepartmentCode(row.department))
    throw new Error(`departamento fuera de la lista: ${row.department}`)
  return { department: row.department, locality: row.locality }
}

export function storedAgeOf(row: {
  age_value: number
  age_unit: string
  age_as_of: string
}): StoredAge {
  return {
    value: row.age_value,
    unit: row.age_unit === 'years' ? 'years' : 'months',
    asOf: row.age_as_of,
  }
}

export type PhotoJson = { id: string; width: number; height: number; thumbhash: string }

// `pet_by_code` arma las fotos en jsonb con estas cuatro claves; la guarda lo hace visible al tipo.
export function isPhotoJson(value: unknown): value is PhotoJson {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'width' in value &&
    typeof value.width === 'number' &&
    'height' in value &&
    typeof value.height === 'number' &&
    'thumbhash' in value &&
    typeof value.thumbhash === 'string'
  )
}
