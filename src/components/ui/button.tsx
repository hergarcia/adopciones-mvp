import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { button } from './button-styles'

// En su propio archivo: la cabecera y `LinkButton` usan las variantes sin el botón, y así no lo bajan
// (historia #350).
export { button }

type Props = React.ComponentProps<'button'> &
  Omit<VariantProps<typeof button>, 'state'> & {
    loading?: boolean
  }

export function Button({
  variant,
  size,
  align,
  loading = false,
  disabled = false,
  className,
  children,
  ...rest
}: Props) {
  const state = disabled ? 'disabled' : loading ? 'loading' : 'idle'

  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(button({ variant, size, align, state }), className)}
      {...rest}
    >
      <BusyLabel loading={loading}>{children}</BusyLabel>
    </button>
  )
}

// El spinner va encima del texto, que queda invisible pero ocupando su lugar: el botón no cambia de
// ancho al cargar. Exportado para el botón de Google, que carga igual pero no es un `Button`; el
// contenedor tiene que ser `relative`.
export function BusyLabel({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <>
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      ) : null}
      <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>
    </>
  )
}

// La animación va en el div y no en el `svg`: varios browsers no aceleran por hardware las
// animaciones CSS sobre elementos SVG.
function Spinner() {
  return (
    <div aria-hidden className="size-4 animate-[spin_var(--dur-spin)_linear_infinite]">
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="8" r="6" opacity="0.25" />
        <path d="M14 8a6 6 0 0 0-6-6" strokeLinecap="round" />
      </svg>
    </div>
  )
}
