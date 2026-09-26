import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Lo que no existe y lo que no es para quien lo pide se ven igual: la pantalla no confirma que la
// ruta exista ni para quién es (la cola de revisión, un pedido que ya se resolvió).
export default async function AppNotFound() {
  const t = await getTranslations('common.not_found')

  return (
    <PageShell>
      <h1 className="afiche text-center text-2xl text-ink">{t('title')}</h1>
      <EmptyState
        title={t('body')}
        action={<LinkButton href="/mi-perfil">{t('back')}</LinkButton>}
      />
    </PageShell>
  )
}
