import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import { getTranslations } from 'next-intl/server'
import { APP_NAME, APP_URL } from '@/lib/config'
import { fontAfterFirstPaintScript } from '@/lib/fonts/after-first-paint'
import '@/styles/globals.css'

// Se autohospeda en el build, así que no hay pedidos a un dominio de terceros.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  // El eje de ancho es la voz de afiche (`.afiche`, 75 %). Sin el óptico: son 53 KB que Lighthouse
  // cuenta antes de pintar el titular de la portada, y sin ellos entra en el LCP (docs/07).
  axes: ['wdth'],
  display: 'swap',
  // Sin precarga: la fuente baja después del primer pintado (lib/fonts/after-first-paint.ts).
  preload: false,
  // El respaldo con las métricas de Bricolage vive en globals.css: el que arma next/font solo busca
  // Arial, que no está en Linux.
  adjustFontFallback: false,
  fallback: ['Texto Fallback'],
  variable: '--font-bricolage',
})

export async function siteMetadata(locale: string): Promise<Metadata> {
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

type Props = { locale: string; children: React.ReactNode }

// El documento de todas las pantallas: el del layout de idioma y el de una dirección que no existe,
// que Next arma por fuera de ese layout (`app/global-not-found.tsx`).
export async function SiteDocument({ locale, children }: Props) {
  const failed = await getTranslations({ locale, namespace: 'common.part_failed' })

  return (
    // Sin NextIntlClientProvider a propósito: mandaría todos los mensajes al browser sin ningún
    // consumidor cliente. Los textos se leen en el servidor y bajan por props, incluidos los de la
    // única hoja cliente de la muestra (constitución §VII, presupuesto de JS). Un `error.tsx` es
    // cliente por definición de Next y no recibe props: con sesión sus textos bajan por
    // `ErrorTextsProvider`, solo las claves que usan; en la zona pública, por
    // `PublicErrorCopyProvider`, sin next-intl en el navegador. Los del aviso de lo que un toque
    // abría y no llegó (`tapFailedTexts`) van en el `body` (historia #318).
    <html lang={locale} className={bricolage.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: fontAfterFirstPaintScript }} />
      </head>
      <body data-part-failed={failed('message')} data-part-retry={failed('retry')}>
        {children}
      </body>
    </html>
  )
}
