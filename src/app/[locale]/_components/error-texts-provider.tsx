import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

// Los textos de los límites de error con sesión viajan al cliente por contexto y no por props (la
// zona pública usa `PublicErrorCopyProvider`, que no baja next-intl al navegador). Un
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
  const identity = await getTranslations('identity.errors')
  const review = await getTranslations('review.errors')
  const pets = await getTranslations('pets')
  const toast = await getTranslations('common.toast')
  const vouches = await getTranslations('vouches.mine')
  const petReview = await getTranslations('pet_review.errors')
  const moderation = await getTranslations('moderation')
  const applications = await getTranslations('applications.errors')

  return (
    <NextIntlClientProvider
      locale={await getLocale()}
      messages={{
        common: {
          error_screen: { title: t('title'), body: t('body'), retry: t('retry') },
          toast: { close: toast('close'), label: toast('label'), region: toast('region') },
        },
        profile: { view: { load_error: profile('load_error'), retry: profile('retry') } },
        vouches: { mine: { load_error: vouches('load_error'), retry: vouches('retry') } },
        verification: { errors: { load_error: verification('load_error') } },
        identity: { errors: { load_error: identity('load_error') } },
        review: { errors: { load_error: review('load_error') } },
        pet_review: { errors: { load_error: petReview('load_error') } },
        moderation: {
          my_blocks: {
            load_error: moderation('my_blocks.load_error'),
            retry: moderation('my_blocks.retry'),
          },
          reports: { load_error: moderation('reports.load_error') },
          suspended_list: { load_error: moderation('suspended_list.load_error') },
          suspended_screen: { load_error: moderation('suspended_screen.load_error') },
        },
        applications: {
          errors: {
            load_error: applications('load_error'),
            form_load_error: applications('form_load_error'),
            retry: applications('retry'),
          },
        },
        pets: {
          my_pets: {
            load_error: pets('my_pets.load_error'),
            retry: pets('my_pets.retry'),
            publish: pets('my_pets.publish'),
          },
          form: {
            load_error: pets('form.load_error'),
            edit_load_error: pets('form.edit_load_error'),
            retry: pets('form.retry'),
          },
          notices: { published: pets('notices.published'), edited: pets('notices.edited') },
        },
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
