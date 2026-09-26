import { getLocale } from 'next-intl/server'
import { nextPhoneCodeAt } from '@/lib/supabase/queries/phone-codes'
import { retryDisplay, type RetryDisplay } from '@/lib/verification/retry-at'
import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'

// Cuándo puede pedir esta cuenta, decidido en el servidor y no en el navegador, que puede tener el
// reloj corrido (FR-010a).
export async function codeAvailability(userId: string): Promise<RetryDisplay> {
  return availabilityFrom(await nextPhoneCodeAt(userId), new Date())
}

// Lo mismo visto desde `from`, para lo que aparece más tarde con la pantalla abierta: la cuenta
// regresiva del cliente arranca cuando eso se monta, no cuando llegó la página.
export async function availabilityFrom(nextCodeAt: Date | null, from: Date): Promise<RetryDisplay> {
  return retryDisplay(nextCodeAt, from, {
    timeZone: URUGUAY_TIME_ZONE,
    locale: await getLocale(),
  })
}
