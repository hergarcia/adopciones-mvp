import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { APP_NAME, APP_URL } from '@/lib/config'
import { isSupportedLocale, routing } from '@/lib/i18n/routing'
import '@/styles/globals.css'

// Sin esto la ruta se sirve a demanda, y una pantalla de espera que no carga datos no tiene por qué
// costar un render por visita: el presupuesto de LCP es parte del diseño (docs/07 §Presupuesto).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Una sola familia, variable, con eje óptico. Se autohospeda en el build, así que no hay pedidos a
// un dominio de terceros, y se precarga para que el intercambio no desplace el layout.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  // El eje de ancho es la voz de afiche (`.afiche`, 75 %); el óptico le da carácter a los títulos.
  axes: ['opsz', 'wdth'],
  display: 'swap',
  preload: true,
  variable: '--font-bricolage',
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
    description: t('description'),
    metadataBase: new URL(APP_URL),
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      description: t('description'),
    },
    // Lo mismo que dice robots.ts, para el crawler que lee la etiqueta y no el archivo: nada se
    // indexa hasta que haya dominio definitivo (docs/04).
    robots: { index: false, follow: false },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()

  // La otra mitad del render estático: next-intl lo pide además de generateStaticParams.
  setRequestLocale(locale)

  return (
    // Sin NextIntlClientProvider a propósito: mandaría todos los mensajes al browser sin ningún
    // consumidor cliente. Los textos se leen en el servidor y bajan por props, incluidos los de la
    // única hoja cliente de la muestra (constitución §VII, presupuesto de JS).
    <html lang={locale} className={bricolage.variable}>
      <body>{children}</body>
    </html>
  )
}
