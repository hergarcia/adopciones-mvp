import { MONTEVIDEO, type DepartmentCode } from '@/lib/zones/departments'
import { MONTEVIDEO_BARRIOS } from './montevideo'
import { INTERIOR_LOCALITIES } from './interior'

// Las sugerencias viajan con el producto y no se le piden a nadie de afuera: el alta es el paso
// del funnel donde más gente se pierde, y un servicio ajeno caído no puede frenarla. Por eso
// tampoco hay estado de carga ni de error en la lista (FR-019a).
export function localitiesFor(department: DepartmentCode): readonly string[] {
  if (department === MONTEVIDEO) return MONTEVIDEO_BARRIOS
  return INTERIOR_LOCALITIES[department]
}
