import { cva } from 'class-variance-authority'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/cn'
import type { FooterScope } from '@/lib/footer/groups'
import { AccountMenu } from './account-menu'
import { FeedbackLink } from './feedback-link'
import { SiteFooter } from './site-footer'
import { Wordmark } from './wordmark'

// El ancho de la hoja sale del menú y no de la zona: el menú es el mismo en todas las pantallas, y
// una hoja que cambia de ancho lo corre al navegar. Sin menú queda el flujo de foco, en la hoja
// angosta (docs/10 §Pantallas anchas, decisión 2026-10-17).
const sheet = cva(
  'mx-auto flex min-h-dvh w-full flex-col bg-canvas lg:min-h-0 lg:border-2 lg:border-ink',
  {
    variants: {
      menu: {
        true: 'max-w-listing',
        false: 'max-w-[var(--measure)]',
      },
    },
  },
)

type Props = {
  children: React.ReactNode
  className?: string
  /** Sin el menú del sitio: la pantalla de una cuenta suspendida, que no puede ir a ningún lado. */
  menu?: boolean
  /** `help`: el pie solo con Ayuda, en la misma pantalla. Es otra regla que la del menú: Opinar
   * muestra el menú entero también a una cuenta suspendida (historia #200). */
  footer?: FooterScope
}

// Opinar está arriba en todas las pantallas, con o sin sesión y también sin menú (FR-020): en la
// fila de la marca no tapa la acción de ninguna pantalla, y el pie lo repite al final. Es un enlace a
// su pantalla y no una hoja que se abre: la ficha no tenía margen en su presupuesto de apertura para
// el código de la hoja (research R10, Cambios de Build). Sin precarga: la pantalla lee de dónde se
// viene, y traída de antes lo leería de otra.
export async function PaperFrame({ children, className, menu = true, footer = 'site' }: Props) {
  const t = await getTranslations('feedback')
  return (
    // Debajo de 1024 la hoja ocupa la ventana entera y pierde el borde: el teléfono es la hoja, y
    // no habría dónde apoyarla.
    <div className={cn('min-h-dvh bg-canvas lg:bg-surface lg:py-10', className)}>
      <div className={sheet({ menu })}>
        {menu ? (
          <AccountMenu feedbackLabel={t('trigger')} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 p-gutter md:p-gutter-wide lg:border-b-2 lg:border-ink">
            <Wordmark />
            <FeedbackLink label={t('trigger')} />
          </div>
        )}
        {/* El pie va al fondo de la ventana aunque la pantalla sea corta. */}
        <div className="flex-1">{children}</div>
        <SiteFooter scope={footer} />
      </div>
    </div>
  )
}
