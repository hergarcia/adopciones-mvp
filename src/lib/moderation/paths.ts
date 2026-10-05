export const MY_BLOCKS_PATH = '/mis-bloqueos'
export const REPORTS_PATH = '/revision/reportes'
export const SUSPENDED_LIST_PATH = '/revision/suspendidas'
export const SUSPENDED_SCREEN_PATH = '/cuenta-suspendida'
export const WITHHELD_PATH = '/verificar-telefono/no-se-puede-usar'

/** Las marcas que abren el reporte o el bloqueo al volver de ingresar, y la del bloqueo hecho. */
export const REPORT_FLAG = 'reportar'
export const BLOCK_FLAG = 'bloquear'
export const BLOCKED_FLAG = 'bloqueo'
/** Llega a Cuentas suspendidas después de suspender desde un perfil, con el nombre. */
export const SUSPENDED_NAME_FLAG = 'suspendida'

export type ModerationQuery = {
  [REPORT_FLAG]?: string
  [BLOCK_FLAG]?: string
  [BLOCKED_FLAG]?: string
}

export function withFlag(path: string, flag: string): string {
  return `${path}?${flag}=1`
}
