/** Cuántas trae cada «Ver más» de las listas de quien administra (research R12). */
export const LIST_STEP = 50

// La base devuelve hasta 100 por llamada; más que esto no se pide por dirección.
const LIST_MAX = 1000

/**
 * Cuántas mostrar, leído de la dirección: «Ver más» suma `LIST_STEP` a las que ya se ven, así no se
 * pierde ninguna (FR-045). Lo que no es un número que sirva vuelve al primer tramo.
 */
export function shownCount(value: string | string[] | undefined): number {
  const asked = typeof value === 'string' && /^\d{1,4}$/u.test(value) ? Number(value) : 0
  // Stryker disable next-line EqualityOperator: equivalente — con 50, `<` y `<=` dan 50 los dos
  return asked < LIST_STEP ? LIST_STEP : Math.min(asked, LIST_MAX)
}
