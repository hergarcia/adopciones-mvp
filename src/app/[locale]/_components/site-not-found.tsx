import { getTranslations } from 'next-intl/server'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { DEFAULT_DESTINATION } from '@/lib/auth/next-destination'
import { PageShell } from './page-shell'

/** La tirita de las pantallas de «no existe»: del ancho de su texto desde 768. */
export const NOT_FOUND_TIRITA = { variant: 'tirita', size: 'lg', className: 'md:w-auto' } as const

type Props = {
  /** Otra tirita en lugar de «Volver a mi perfil», ya traducida. */
  action?: React.ReactNode
}

// «Acá no hay nada»: una dirección que no existe y una pantalla que no es para quien la pide se ven
// igual, así comparándolas no se sabe cuál existe (historias #73 y #344). La otra tirita llega por
// props y no se elige acá: importarla sumaría su código a cada pantalla con sesión, que cargan este
// `not-found` aunque nunca lo dibujen.
export async function SiteNotFound({ action }: Props) {
  const t = await getTranslations('common.not_found')
  return (
    <PageShell width="full">
      <HeadedEmptyState
        title={t('title')}
        body={t('body')}
        action={
          action ?? (
            <LinkButton href={DEFAULT_DESTINATION} {...NOT_FOUND_TIRITA}>
              {t('back')}
            </LinkButton>
          )
        }
      />
    </PageShell>
  )
}
