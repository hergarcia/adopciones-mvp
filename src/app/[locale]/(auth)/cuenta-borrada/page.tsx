import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EmptyState } from '@/components/ui/empty-state'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.account_deleted')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// FR-028c pide dos salidas y `EmptyState` tiene una sola acción por definición: se resuelve
// componiendo, no haciendo crecer la primitiva para un caso.
export default async function AccountDeletedPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('profile.delete')

  return (
    <PageShell>
      <EmptyState
        title={t('done_title')}
        action={
          <Link
            href="/entrar"
            className="afiche border-2 border-ink bg-ink px-5 py-3 text-lg text-canvas transition-colors duration-[var(--dur-fast)] ease-out hover:bg-canvas hover:text-ink"
          >
            {t('done_create')}
          </Link>
        }
      />
      <p className="mt-6 text-center">
        <Link
          href="/"
          className="text-base text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
        >
          {t('done_home')}
        </Link>
      </p>
    </PageShell>
  )
}
