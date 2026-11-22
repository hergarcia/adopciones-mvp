import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { FullPageLinkButton } from '@/components/ui/full-page-link-button'
import { APP_NAME } from '@/lib/config'
import { routing } from '@/lib/i18n/routing'
import { LISTING_PATH } from '@/lib/pets/paths'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { PaperFrame } from '@/app/[locale]/_components/paper-frame'
import { SiteDocument, siteMetadata } from '@/app/[locale]/_components/site-document'
import { NOT_FOUND_TIRITA, SiteNotFound } from '@/app/[locale]/_components/site-not-found'

const locale = routing.defaultLocale

// El mismo título que Administrar le da a quien no administra: comparando las dos pestañas no se
// sabe cuál existe (historias #73 y #344).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'common.not_found' })
  const title = `${t('title')} · ${APP_NAME}`
  const site = await siteMetadata(locale)
  return { ...site, title, openGraph: { ...site.openGraph, title } }
}

// Una dirección que no existe en ninguna parte del sitio. Next la arma por fuera del layout de
// idioma, así que trae su propio documento; sin este archivo contestaba con su 404 de fábrica, en
// inglés y sin la hoja (KL-73-6). Un `notFound()` de una página lo contesta Next en el navegador y
// el HTML llega vacío: acá la pantalla viene entera del servidor.
//
// Sin sesión, quien cae acá casi siempre viene de un cartel o de un grupo buscando un animal: la
// tirita lleva al listado. Ese listado tiene otro documento y abre como página entera, así que es un
// `FullPageLinkButton`: el `Link` de Next esperaría sin mostrar nada.
export default async function GlobalNotFound() {
  const user = await getSessionUser()
  const pets = await getTranslations({ locale, namespace: 'pets.page' })
  return (
    <SiteDocument locale={locale}>
      <PaperFrame>
        <SiteNotFound
          action={
            user === null ? (
              <FullPageLinkButton href={LISTING_PATH} {...NOT_FOUND_TIRITA}>
                {pets('to_listing')}
              </FullPageLinkButton>
            ) : undefined
          }
        />
      </PaperFrame>
    </SiteDocument>
  )
}
