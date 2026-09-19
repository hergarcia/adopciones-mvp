// Los diecinueve departamentos de Uruguay, con su código ISO 3166-2:UY. No cambian desde 1885,
// así que la lista es una constante y no un dato de la base. El código es lo que se guarda; el
// nombre es lo que se muestra.
export const DEPARTMENTS = [
  { code: 'UY-AR', name: 'Artigas' },
  { code: 'UY-CA', name: 'Canelones' },
  { code: 'UY-CL', name: 'Cerro Largo' },
  { code: 'UY-CO', name: 'Colonia' },
  { code: 'UY-DU', name: 'Durazno' },
  { code: 'UY-FS', name: 'Flores' },
  { code: 'UY-FD', name: 'Florida' },
  { code: 'UY-LA', name: 'Lavalleja' },
  { code: 'UY-MA', name: 'Maldonado' },
  { code: 'UY-MO', name: 'Montevideo' },
  { code: 'UY-PA', name: 'Paysandú' },
  { code: 'UY-RN', name: 'Río Negro' },
  { code: 'UY-RV', name: 'Rivera' },
  { code: 'UY-RO', name: 'Rocha' },
  { code: 'UY-SA', name: 'Salto' },
  { code: 'UY-SJ', name: 'San José' },
  { code: 'UY-SO', name: 'Soriano' },
  { code: 'UY-TA', name: 'Tacuarembó' },
  { code: 'UY-TT', name: 'Treinta y Tres' },
] as const

export type DepartmentCode = (typeof DEPARTMENTS)[number]['code']

// El literal y no `DepartmentCode`: así una comparación contra esta constante estrecha el
// tipo, y la tabla del interior puede excluir Montevideo sin castear nada.
export const MONTEVIDEO = 'UY-MO' satisfies DepartmentCode

const CODES: ReadonlySet<string> = new Set(DEPARTMENTS.map((d) => d.code))

export function isDepartmentCode(value: string): value is DepartmentCode {
  return CODES.has(value)
}

export function departmentName(code: DepartmentCode): string {
  return DEPARTMENTS.find((d) => d.code === code)!.name
}
