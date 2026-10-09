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
