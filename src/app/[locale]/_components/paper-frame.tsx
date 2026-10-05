import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { AccountMenu } from './account-menu'
import { Wordmark } from './wordmark'

// El tamaño del papel es una propiedad de la zona, no de cada pantalla: el sitio público es el
// afiche de la pared, el ingreso es un volante, y la app es la hoja sobre la que se trabaja
// (docs/10 §Pantallas anchas).
const sheet = cva('mx-auto w-full bg-canvas lg:border-2 lg:border-ink', {
  variants: {
    size: {
      handbill: 'max-w-[var(--measure)]',
      working: 'max-w-page',
      wall: 'max-w-listing',
    },
  },
  defaultVariants: { size: 'working' },
})

type Props = VariantProps<typeof sheet> & {
  children: React.ReactNode
  className?: string
  /** Sin el menú del sitio: la pantalla de una cuenta suspendida, que no puede ir a ningún lado. */
  menu?: boolean
}

export function PaperFrame({ size, children, className, menu = true }: Props) {
  return (
    // Debajo de 1024 la hoja ocupa la ventana entera y pierde el borde: el teléfono es la hoja, y
    // no habría dónde apoyarla.
    <div className={cn('min-h-dvh bg-canvas lg:bg-surface lg:py-10', className)}>
      <div className={sheet({ size })}>
        {menu ? (
          <AccountMenu />
        ) : (
          <div className="p-gutter md:p-gutter-wide lg:border-b-2 lg:border-ink">
            <Wordmark />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
