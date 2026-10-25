import { uruguayDay } from '@/lib/pets/age'

/**
 * La fecha de entrega que muestra la ficha (FR-030): hasta el final de ese día en Uruguay, y desde el
 * siguiente, ninguna. `deliversFrom` es `AAAA-MM-DD`, como la guarda la base.
 */
export function visibleDeliveryDate(deliversFrom: string | null, now: Date): string | null {
  // Stryker disable next-line ConditionalExpression: equivalente — `null >= '2026-11-03'` también da false; la guarda es para el tipo
  return deliversFrom !== null && deliversFrom >= uruguayDay(now) ? deliversFrom : null
}
