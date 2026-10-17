import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { SingleTaskLayout } from '@/app/[locale]/_components/single-task-layout'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.account_deleted')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// FR-028c pide dos salidas y `EmptyState` tiene una sola acción por definición: se resuelve
// componiendo, no haciendo crecer la primitiva para un caso. El cartel y la frase son la
// presentación y las salidas la tarea. Es una confirmación, así que desde 1024 cada parte sigue
// centrada en su mitad: alineado a la izquierda, el cartel quedaba corrido del título, porque el
// dibujo está centrado en su recuadro (docs/10 §Layout).
export default async function AccountDeletedPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()

  const t = await getTranslations('profile.delete')

  return (
    <SingleTaskLayout
      presentation={
        <>
          <h1 className="afiche text-center text-2xl text-ink">{t('done_title')}</h1>
          <EmptyState title={t('done_body')} />
        </>
      }
      task={
        <div className="flex flex-col items-center gap-6">
          <LinkButton href="/entrar">{t('done_create')}</LinkButton>
          <LinkButton href="/" variant="ghost">
            {t('done_home')}
          </LinkButton>
        </div>
      }
    />
  )
}
