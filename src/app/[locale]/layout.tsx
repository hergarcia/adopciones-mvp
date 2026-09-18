import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
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

export const metadata: Metadata = {
  title: APP_NAME,
  metadataBase: new URL(APP_URL),
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()

  // Habilita el render estático: sin esto la ruta se sirve a demanda aunque haya
  // generateStaticParams, y una pantalla que no carga datos no tiene por qué costar eso.
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
