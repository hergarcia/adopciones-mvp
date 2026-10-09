import { cva, type VariantProps } from 'class-variance-authority'
import { getTranslations } from 'next-intl/server'
import { SupportWhatsAppLink } from '@/components/support/support-whatsapp-link'
import { cn } from '@/lib/cn'
import { SUPPORT_WHATSAPP } from '@/lib/config'
import { FEEDBACK_PATH } from '@/lib/feedback/screens'
import { QUESTIONS_PATH } from '@/lib/questions/paths'
import { supportWhatsAppHref } from '@/lib/support/whatsapp'
import { AccountMenu } from './account-menu'
import { NavLink } from './nav-link'
import { SiteFooter } from './site-footer'
import { Wordmark } from './wordmark'

// El tamaño del papel es una propiedad de la zona, no de cada pantalla: el sitio público es el
// afiche de la pared, el ingreso es un volante, y la app es la hoja sobre la que se trabaja
// (docs/10 §Pantallas anchas).
const sheet = cva(
  'mx-auto flex min-h-dvh w-full flex-col bg-canvas lg:min-h-0 lg:border-2 lg:border-ink',
  {
    variants: {
      size: {
        handbill: 'max-w-[var(--measure)]',
        working: 'max-w-page',
        wall: 'max-w-listing',
      },
    },
    defaultVariants: { size: 'working' },
  },
)

type Props = VariantProps<typeof sheet> & {
  children: React.ReactNode
  className?: string
  /** Sin el menú del sitio: la pantalla de una cuenta suspendida, que no puede ir a ningún lado. */
  menu?: boolean
  /** Sin el renglón de las preguntas: la misma pantalla, que no puede abrirlas (historia #8). */
  questions?: boolean
}

// Opinar está arriba en todas las pantallas, con o sin sesión y también sin menú (FR-020): en la
// fila de la marca no tapa la acción de ninguna pantalla, y el pie lo repite al final. Es un enlace a
// su pantalla y no una hoja que se abre: la ficha no tenía margen en su presupuesto de apertura para
// el código de la hoja (research R10, Cambios de Build). Sin precarga: la pantalla lee de dónde se
// viene, y traída de antes lo leería de otra.
export async function PaperFrame({
  size,
  children,
  className,
  menu = true,
  questions = true,
}: Props) {
  const [t, tSupport, tQuestions] = await Promise.all([
    getTranslations('feedback'),
    getTranslations('support.footer'),
    getTranslations('questions.footer'),
  ])
  const supportHref = supportWhatsAppHref(SUPPORT_WHATSAPP)
  const feedback = (label: string) => (
    <NavLink href={FEEDBACK_PATH} prefetch={false}>
      {label}
    </NavLink>
  )
  return (
    // Debajo de 1024 la hoja ocupa la ventana entera y pierde el borde: el teléfono es la hoja, y
    // no habría dónde apoyarla.
    <div className={cn('min-h-dvh bg-canvas lg:bg-surface lg:py-10', className)}>
      <div className={sheet({ size })}>
        {menu ? (
          <AccountMenu feedback={feedback(t('trigger'))} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 p-gutter md:p-gutter-wide lg:border-b-2 lg:border-ink">
            <Wordmark />
            {feedback(t('trigger'))}
          </div>
        )}
        {/* El pie va al fondo de la ventana aunque la pantalla sea corta. */}
        <div className="flex-1">{children}</div>
        <SiteFooter
          questions={
            questions
              ? {
                  prompt: tQuestions('prompt'),
                  action: (
                    <NavLink href={QUESTIONS_PATH} prefetch={false}>
                      {tQuestions('action')}
                    </NavLink>
                  ),
                }
              : null
          }
          feedback={{ prompt: t('footer.prompt'), action: feedback(t('footer.action')) }}
          support={
            supportHref === null
              ? null
              : {
                  prompt: tSupport('prompt'),
                  action: (
                    <SupportWhatsAppLink href={supportHref}>
                      {tSupport('action')}
                    </SupportWhatsAppLink>
                  ),
                }
          }
        />
      </div>
    </div>
  )
}
