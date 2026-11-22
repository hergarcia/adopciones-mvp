import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { isSupportedLocale, routing } from '@/lib/i18n/routing'
import { SiteDocument, siteMetadata } from './_components/site-document'

// Sin esto la ruta se sirve a demanda, y una pantalla de espera que no carga datos no tiene por qué
// costar un render por visita: el presupuesto de LCP es parte del diseño (docs/07 §Presupuesto).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return siteMetadata(locale)
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()

  // La otra mitad del render estático: next-intl lo pide además de generateStaticParams.
  setRequestLocale(locale)

  return <SiteDocument locale={locale}>{children}</SiteDocument>
}
