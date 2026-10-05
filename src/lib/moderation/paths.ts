export const MY_BLOCKS_PATH = '/mis-bloqueos'
export const REPORTS_PATH = '/revision/reportes'
export const SUSPENDED_LIST_PATH = '/revision/suspendidas'
export const SUSPENDED_SCREEN_PATH = '/cuenta-suspendida'
export const WITHHELD_PATH = '/verificar-telefono/no-se-puede-usar'

/** Las marcas que abren el reporte o el bloqueo al volver de ingresar, y la del bloqueo hecho. */
export const REPORT_FLAG = 'reportar'
export const BLOCK_FLAG = 'bloquear'
export const BLOCKED_FLAG = 'bloqueo'
/** Lo que dice la pantalla después de bloquear o desbloquear: hecho, deshecho, o ya estaba. */
export const BLOCKED_NOTICES = { hecho: 'blocked', deshecho: 'unblocked', ya: 'already' } as const
export type BlockedNotice = keyof typeof BLOCKED_NOTICES

export function parseBlockedNotice(value: string | undefined): BlockedNotice | null {
  return value === 'hecho' || value === 'deshecho' || value === 'ya' ? value : null
}

/** Llega a Cuentas suspendidas después de suspender desde un perfil, con el nombre. */
export const SUSPENDED_NAME_FLAG = 'suspendida'

export type ModerationQuery = {
  [REPORT_FLAG]?: string
  [BLOCK_FLAG]?: string
  [BLOCKED_FLAG]?: string
}

export function withFlag(path: string, flag: string, value = '1'): string {
  return `${path}?${flag}=${value}`
}
