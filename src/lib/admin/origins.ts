import type { AdminOrigin } from './types'

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
