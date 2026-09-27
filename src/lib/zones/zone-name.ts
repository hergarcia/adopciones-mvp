import { departmentName, type DepartmentCode } from './departments'

/** «Pocitos, Montevideo»: la localidad y el departamento, como se muestra una zona. */
export function zoneName(zone: { department: DepartmentCode; locality: string }): string {
  return `${zone.locality}, ${departmentName(zone.department)}`
}
