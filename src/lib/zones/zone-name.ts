import { departmentName, type DepartmentCode } from './departments'

/**
 * «Pocitos, Montevideo»: la localidad y el departamento, como se muestra una zona. Cuando la
 * localidad se llama como su departamento («Salto, Salto») se nombra una sola vez.
 */
export function zoneName(zone: { department: DepartmentCode; locality: string }): string {
  const department = departmentName(zone.department)
  const isCapital = zone.locality.localeCompare(department, 'es', { sensitivity: 'base' }) === 0
  return isCapital ? department : `${zone.locality}, ${department}`
}
