import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { APP_NAME } from '@/lib/config'
import { PageShell } from './_components/page-shell'

type Props = {
  params: Promise<{ locale: string }>
}

// Absoluto: el sufijo del layout dejaría la portada como «Adopciones · Adopciones». La descripción
// del sitio se hereda, que es la misma que describe la portada.
//
// La canónica se escribe entera y acá, no relativa en el layout: el segmento de idioma no está en
// la URL del español (`localePrefix: 'as-needed'`), así que una relativa resuelve a /es, que es la
// ruta interna y no la página que se sirve. Cada pantalla con URL propia declara la suya.
export const metadata: Metadata = {
  title: { absolute: APP_NAME },
  alternates: { canonical: '/' },
}

// Portada provisoria; la reemplaza la historia que defina la real. No carga datos, así que no tiene
// estados de carga, vacío ni error (FR-034). Sin acento: docs/10 lo reserva para la urgencia, y una
// pantalla de espera no tiene ninguna.
export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('common')

  return (
    <PageShell>
      <h1 className="afiche text-4xl text-ink">{APP_NAME}</h1>
      <Card taped className="mt-8">
        <p className="text-base text-ink">{t('under_construction')}</p>
      </Card>
    </PageShell>
  )
}
