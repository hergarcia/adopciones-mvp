import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { APP_NAME } from '@/lib/config'

type Props = {
  params: Promise<{ locale: string }>
}

// Portada provisoria: el nombre y una frase, nada más. No carga datos, así que no tiene estados de
// carga, vacío ni error propios (FR-034). La reemplaza la historia que defina la portada real.
//
// Sin acento: docs/10 lo reserva para la urgencia, y una pantalla de espera no tiene ninguna. Un
// gesto por elemento: el nombre va en voz de afiche, y el aviso es una nota pegada con cinta.
export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('common')

  return (
    <main className="max-w-[var(--measure)] p-4">
      <h1 className="afiche text-4xl text-ink">{APP_NAME}</h1>
      <Card taped className="mt-8">
        <p className="text-base text-ink">{t('under_construction')}</p>
      </Card>
    </main>
  )
}
