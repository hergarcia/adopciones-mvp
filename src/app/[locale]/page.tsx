import { getTranslations, setRequestLocale } from 'next-intl/server'
import { APP_NAME } from '@/lib/config'

type Props = {
  params: Promise<{ locale: string }>
}

// Portada provisoria: el nombre y una frase, nada más. No carga datos, así que no tiene estados de
// carga, vacío ni error propios (FR-034). La reemplaza la historia que defina la portada real.
//
// Sin acento: docs/10 lo reserva para la urgencia, y una pantalla de espera no tiene ninguna. Lo
// único que llama la atención es el nombre, por su peso y su tracking.
export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('common')

  return (
    <main className="max-w-[var(--measure)] p-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{APP_NAME}</h1>
      <p className="mt-2 text-base text-ink-muted">{t('under_construction')}</p>
    </main>
  )
}
