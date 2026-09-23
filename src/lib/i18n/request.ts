import { getRequestConfig } from 'next-intl/server'
import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'
import { isSupportedLocale, routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = isSupportedLocale(requested) ? requested : routing.defaultLocale

  // Sin zona, next-intl formatea con la del servidor, que en Vercel es UTC: "desde el 20 de
  // septiembre" podía salir un día corrido.
  return {
    locale,
    timeZone: URUGUAY_TIME_ZONE,
    messages: (await import(`../../../messages/${locale}.json`)).default,
  }
})
