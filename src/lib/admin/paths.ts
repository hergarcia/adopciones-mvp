import type { AdminOrigin } from './types'

export const ADMIN_PATH = '/administrar'

/** Lo que dice `?desde=` en la dirección de Administrar, por origen. */
const ADMIN_FROM: Record<Exclude<AdminOrigin, 'other'>, string> = {
  menu: 'menu',
  profile: 'perfil',
  digest: 'resumen',
}

export function adminPathFrom(origin: Exclude<AdminOrigin, 'other'>): string {
  return `${ADMIN_PATH}?desde=${ADMIN_FROM[origin]}`
}

/** El valor de `?desde=` de cada lista que lleva a una ficha. */
export const RECORD_FROM = {
  identity: 'identidad',
  pets: 'publicaciones',
  reports: 'reportes',
  suspended: 'suspendidas',
  search: 'busqueda',
} as const

export function personRecordPath(publicId: string, from?: keyof typeof RECORD_FROM): string {
  const path = `${ADMIN_PATH}/personas/${encodeURIComponent(publicId)}`
  return from === undefined ? path : `${path}?desde=${RECORD_FROM[from]}`
}

/** Cuántos antecedentes muestra cada parte de la ficha, y cuántos más suma «Ver más» (FR-036). */
export const RECORD_STEP = 20

/** Las cuatro partes de la ficha, en su orden. */
export const RECORD_PART_KEYS = ['identity', 'reports', 'suspensions', 'pets'] as const
export type RecordPart = (typeof RECORD_PART_KEYS)[number]

/** El parámetro de la dirección con cuántos se ven de cada parte, que es también su ancla. */
export const RECORD_PARTS: Record<RecordPart, string> = {
  identity: 'identidad',
  reports: 'reportes',
  suspensions: 'suspensiones',
  pets: 'publicaciones',
}
