import type { Voucher } from './types'

// Los que se ven de entrada en el perfil público. Sin tope de avales (decisión 2026-09-26), una
// rescatista con decenas empujaba todo lo demás al fondo de la página.
export const VISIBLE_VOUCHERS = 5

/** Los más recientes a la vista y el resto para desplegar, en el mismo orden. */
export function splitVouchers(vouchers: readonly Voucher[]): {
  shown: readonly Voucher[]
  rest: readonly Voucher[]
} {
  return { shown: vouchers.slice(0, VISIBLE_VOUCHERS), rest: vouchers.slice(VISIBLE_VOUCHERS) }
}
