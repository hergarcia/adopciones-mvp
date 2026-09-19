import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
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
      <h1 className="afiche text-center text-2xl text-ink">{t('done_title')}</h1>
      <EmptyState
        title={t('done_body')}
        action={<LinkButton href="/entrar">{t('done_create')}</LinkButton>}
      />
      <p className="mt-6 text-center">
        <LinkButton href="/" variant="ghost">
          {t('done_home')}
        </LinkButton>
      </p>
    </PageShell>
  )
}
