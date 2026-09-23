import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

// El único lugar del producto donde un texto viaja al cliente por contexto y no por props. Un
// `error.tsx` es cliente por definición de Next y recibe solo `error` y `reset`, así que no hay
// camino para bajarle los textos desde el servidor: sin esto, el propio límite de error lanza al
// renderizar y la persona ve la pantalla cruda de Next en vez de la pantalla de error diseñada.
//
// Viajan solo las claves que los límites usan, no los mensajes enteros: el layout de idioma
// deja el provider afuera justamente para que `messages/es.json` no baje al navegador
// (constitución §VII, presupuesto de JS).
export async function ErrorTextsProvider({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common.error_screen')
  const profile = await getTranslations('profile.view')
  const verification = await getTranslations('verification.errors')

  return (
    <NextIntlClientProvider
      locale={await getLocale()}
      messages={{
        common: { error_screen: { title: t('title'), body: t('body'), retry: t('retry') } },
        profile: { view: { load_error: profile('load_error'), retry: profile('retry') } },
        verification: {
          errors: { load_error: verification('load_error'), retry: verification('retry') },
        },
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
