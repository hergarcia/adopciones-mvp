import type { DepartmentCode } from './departments'

// El literal y no `DepartmentCode`: así una comparación contra esta constante estrecha el tipo, y
// la tabla del interior puede excluir Montevideo sin castear nada. En su propio archivo para que el
// formulario de la zona no baje la lista de los diecinueve departamentos (historia #304).
export const MONTEVIDEO = 'UY-MO' satisfies DepartmentCode
