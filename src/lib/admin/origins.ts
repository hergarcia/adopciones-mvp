import type { AdminOrigin, RecordOrigin } from './types'

/** Desde dónde se abrió Administrar, por `?desde=`; cualquier otra cosa es `other`. */
export function parseAdminOrigin(value: string | string[] | undefined): AdminOrigin {
  switch (value) {
    case 'menu':
      return 'menu'
    case 'perfil':
      return 'profile'
    case 'resumen':
      return 'digest'
    default:
      return 'other'
  }
}

/** Desde dónde se abrió una ficha, por `?desde=`; cualquier otra cosa es `other`. */
export function parseRecordOrigin(value: string | string[] | undefined): RecordOrigin {
  switch (value) {
    case 'identidad':
      return 'identity'
    case 'publicaciones':
      return 'pets'
    case 'reportes':
      return 'reports'
    case 'suspendidas':
      return 'suspended'
    case 'busqueda':
      return 'search'
    default:
      return 'other'
  }
}
