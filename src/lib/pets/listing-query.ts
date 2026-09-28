import { DEPARTMENTS, departmentSlug, type DepartmentCode } from '@/lib/zones/departments'
import { LISTING_PATH } from './paths'
import { LISTING_MAX_SHOWN, LISTING_PAGE_SIZE } from './rules'
import { SEXES, SIZES, SPECIES, type Sex, type Size, type Species } from './options'

export const AGE_BAND_NAMES = ['puppy', 'young', 'adult', 'senior'] as const
export type AgeBand = (typeof AGE_BAND_NAMES)[number]

export type ListingFilters = {
  species: Species[]
  sex: Sex[]
  size: Size[]
  age: AgeBand[]
  department: DepartmentCode[]
  neutered: 'yes'[]
}

export type ListingFilter = keyof ListingFilters
type Option<F extends ListingFilter> = ListingFilters[F][number]

/** Una opción marcada, en claves de dominio: la usa la medición (`listing_filter_used`). */
export type AddedOption = { filter: ListingFilter; option: string }

type Entry<F extends ListingFilter> = {
  key: string
  options: readonly Option<F>[]
  /** El valor de cada opción en la dirección, en el mismo orden. */
  values: readonly string[]
}

// El vocabulario de la dirección: la clave en español, y cada opción de dominio con su valor. El
// orden de las claves y de las opciones es el de la dirección canónica (contracts/routes.md).
const VOCABULARY: { [F in ListingFilter]: Entry<F> } = {
  species: { key: 'especie', options: SPECIES, values: ['perro', 'gato'] },
  sex: { key: 'sexo', options: SEXES, values: ['macho', 'hembra'] },
  size: { key: 'tamano', options: SIZES, values: ['chico', 'mediano', 'grande'] },
  age: { key: 'edad', options: AGE_BAND_NAMES, values: ['cachorro', 'joven', 'adulto', 'mayor'] },
  department: {
    key: 'departamento',
    options: DEPARTMENTS.map((department) => department.code),
    values: DEPARTMENTS.map((department) => departmentSlug(department.code)),
  },
  neutered: { key: 'castrado', options: ['yes'], values: ['si'] },
}

export const LISTING_FILTERS: ListingFilter[] = [
  'species',
  'sex',
  'size',
  'age',
  'department',
  'neutered',
]

export const NO_FILTERS: ListingFilters = {
  species: [],
  sex: [],
  size: [],
  age: [],
  department: [],
  neutered: [],
}

export const SHOWN_KEY = 'mostrar'
export const CURSOR_KEY = 'despues'
export const ADDED_KEY = 'sumadas'

export function filterOptions<F extends ListingFilter>(filter: F): readonly Option<F>[] {
  const entry: Entry<F> = VOCABULARY[filter]
  return entry.options
}

function valueOf(filter: ListingFilter, option: string): string | undefined {
  const options: readonly string[] = VOCABULARY[filter].options
  return VOCABULARY[filter].values[options.indexOf(option)]
}

export type Query = Record<string, string | string[] | undefined>

// `[undefined].join()` es '': una clave que no vino no aporta ningún valor.
function valuesOf(query: Query, key: string): string[] {
  return [query[key]].flat().join(',').toLowerCase().split(',')
}

// Las opciones de un filtro que están entre los valores, en el orden de la tabla. Todas dan lo mismo
// que ninguna; castrado tiene una sola, así que no.
function chosen<F extends ListingFilter>(
  filter: F,
  values: readonly (string | undefined)[],
): Option<F>[] {
  const entry: Entry<F> = VOCABULARY[filter]
  const picked = entry.options.filter((_, index) => values.includes(entry.values[index]))
  return filter !== 'neutered' && picked.length === entry.options.length ? [] : picked
}

function parseShown(query: Query): number {
  const shown = Number([query[SHOWN_KEY]].flat()[0])
  const valid = shown > 0 && shown <= LISTING_MAX_SHOWN && shown % LISTING_PAGE_SIZE === 0
  return valid ? shown : LISTING_PAGE_SIZE
}

// El único validador de los filtros: lo que no está en el vocabulario se ignora, sin error, y el
// orden o las repeticiones no cambian nada (FR-017a, Edge Cases «Filtros repetidos o mezclados»).
export function parseListingQuery(query: Query): { filters: ListingFilters; shown: number } {
  const read = <F extends ListingFilter>(filter: F) =>
    chosen(filter, valuesOf(query, VOCABULARY[filter].key))
  return {
    filters: {
      species: read('species'),
      sex: read('sex'),
      size: read('size'),
      age: read('age'),
      department: read('department'),
      neutered: read('neutered'),
    },
    shown: parseShown(query),
  }
}

function optionsIn(filters: ListingFilters, filter: ListingFilter): readonly string[] {
  return filters[filter]
}

export function hasFilters(filters: ListingFilters): boolean {
  return LISTING_FILTERS.some((filter) => optionsIn(filters, filter).length > 0)
}

// La dirección canónica: dos personas con los mismos filtros comparten la misma, y nada que no sea
// del sitio sobrevive en ella (como el `fbclid` que agrega Facebook).
export function listingSearch(filters: ListingFilters, shown = LISTING_PAGE_SIZE): string {
  const parts = LISTING_FILTERS.flatMap((filter) => {
    const marked = optionsIn(filters, filter).map((option) => valueOf(filter, option))
    const values = chosen(filter, marked).map((option) => valueOf(filter, option))
    return values.length === 0 ? [] : [`${VOCABULARY[filter].key}=${values.join(',')}`]
  })
  if (shown > LISTING_PAGE_SIZE) parts.push(`${SHOWN_KEY}=${shown}`)
  return parts.join('&')
}

export function listingHref(filters: ListingFilters, shown = LISTING_PAGE_SIZE): string {
  const search = listingSearch(filters, shown)
  return search === '' ? LISTING_PATH : `${LISTING_PATH}?${search}`
}

function querySearch(query: Query): string {
  return Object.entries(query)
    .flatMap(([key, value]) => [value ?? []].flat().map((one) => `${key}=${one}`))
    .join('&')
}

/** Si la dirección que llegó no es la canónica de lo que dice, la página redirige a esa. */
export function isCanonicalListingQuery(query: Query): boolean {
  const { filters, shown } = parseListingQuery(query)
  return querySearch(query) === listingSearch(filters, shown)
}

/** `URLSearchParams` a la forma de `searchParams` de Next, con las claves repetidas en lista. */
export function queryOf(params: URLSearchParams): Query {
  const query: Record<string, string[]> = {}
  for (const [key, value] of params) query[key] = [...(query[key] ?? []), value]
  return query
}

/** «especie.gato,edad.cachorro»: lo que el controlador manda en `sumadas`. */
export function formatAddedOptions(added: AddedOption[]): string {
  return added
    .map(({ filter, option }) => `${VOCABULARY[filter].key}.${valueOf(filter, option)}`)
    .join(',')
}

// Lo que llega del cliente, validado contra el mismo vocabulario y devuelto en claves de dominio:
// nunca texto libre en una propiedad de la medición.
export function parseAddedOptions(raw: string | null | undefined): AddedOption[] {
  return [...new Set(String(raw).split(','))].flatMap((pair): AddedOption[] => {
    const [key, value] = pair.split('.')
    const filter = LISTING_FILTERS.find((name) => VOCABULARY[name].key === key)
    if (filter === undefined) return []
    return chosen(filter, [value]).map((option) => ({ filter, option }))
  })
}

export const LISTING_API_PATH = '/api/animales'

type ApiRequest = { shown?: number; cursor?: string | null; added?: AddedOption[] }

// Lo que pide el controlador: los mismos filtros de la dirección, y el cursor de «Ver más» o las
// opciones recién marcadas para la medición. El cursor lleva la zona con `+`: va codificado.
export function listingApiHref(filters: ListingFilters, request: ApiRequest = {}): string {
  const { shown = LISTING_PAGE_SIZE, cursor = null, added = [] } = request
  const parts = [listingSearch(filters, shown)]
  if (cursor !== null) parts.push(`${CURSOR_KEY}=${encodeURIComponent(cursor)}`)
  if (added.length > 0) parts.push(`${ADDED_KEY}=${formatAddedOptions(added)}`)
  const search = parts.filter((part) => part !== '').join('&')
  return search === '' ? LISTING_API_PATH : `${LISTING_API_PATH}?${search}`
}
