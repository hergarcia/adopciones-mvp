import type { AgeBand } from '@/lib/pets/listing-query'
import type { Sex, Size, Species } from '@/lib/pets/options'
import type { DepartmentCode } from '@/lib/zones/departments'
import type { AlertFilters } from './types'

type Gendered = { masculine: string; feminine: string }

/** Las piezas del nombre, traducidas (`alerts.name.*`), con su forma femenina donde cambia. */
export type AlertNameWords = {
  /** Sin filtros: «Todos los animales en adopción». */
  all: string
  /** Sin especie ni sexo: «Animales». */
  animals: string
  species: Record<Species, Gendered>
  /** Sin especie, con un sexo: «Machos», «Hembras». */
  sexNoun: Record<Sex, string>
  /** Con especie y solo machos, después del sustantivo: «machos». */
  males: string
  size: Record<Size, Gendered>
  age: Record<AgeBand, Gendered>
  neutered: Gendered
  /** La unión de dos opciones del mismo filtro: «o». */
  or: string
  /** «en Montevideo». */
  inDepartment: (department: DepartmentCode) => string
}

const only = <T>(options: readonly T[]): T | null =>
  options.length === 1 ? (options[0] ?? null) : null

function noun(filters: AlertFilters, words: AlertNameWords, gender: keyof Gendered): string {
  const species = only(filters.species)
  const sex = only(filters.sex)
  if (species === null) return sex === null ? words.animals : words.sexNoun[sex]
  const name = words.species[species][gender]
  return sex === 'male' ? `${name} ${words.males}` : name
}

// El aviso en una frase (research R10): el sustantivo, los tamaños y las edades unidos con «o»,
// castrados y el departamento. Con solo hembras, todo concuerda en femenino.
export function alertName(filters: AlertFilters, words: AlertNameWords): string {
  const department = only(filters.department)
  const nothing = Object.values(filters).every((options: readonly string[]) => options.length === 0)
  if (nothing) return words.all

  const gender: keyof Gendered = only(filters.sex) === 'female' ? 'feminine' : 'masculine'
  const joined = (parts: string[]) => parts.join(` ${words.or} `)
  const parts = [
    noun(filters, words, gender),
    joined(filters.size.map((size) => words.size[size][gender])),
    joined(filters.age.map((age) => words.age[age][gender])),
    filters.neutered.length > 0 ? words.neutered[gender] : '',
    department === null ? '' : words.inDepartment(department),
  ]
  return parts.filter((part) => part !== '').join(' ')
}
