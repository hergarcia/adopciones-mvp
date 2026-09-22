import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// `tirita` es la acción principal de la pantalla: una sola por pantalla (docs/10 §Componentes).
//
// Exportado para `LinkButton`: una acción que navega es un `a` y no un `button` (docs/10 §Piso de
// accesibilidad), y sin compartir las variantes cada enlace redibujaría el botón a mano.
export const button = cva(
  'afiche press relative inline-flex items-center justify-center border-2 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'border-ink bg-ink text-canvas hover:bg-canvas hover:text-ink',
        secondary: 'border-ink bg-canvas text-ink hover:bg-ink hover:text-canvas',
        ghost:
          'border-transparent text-ink underline decoration-2 underline-offset-4 hover:decoration-4',
        // La acción destructiva que todavía no es la confirmación: el disparador de «Borrar mi
        // cuenta» tiene que decir a qué lleva sin gritarlo, así que es texto y no un bloque rojo.
        'ghost-danger':
          'border-transparent text-accent underline decoration-2 underline-offset-4 hover:decoration-4',
        danger: 'border-accent bg-accent text-canvas hover:bg-canvas hover:text-accent',
        tirita: 'perforado w-full border-ink bg-ink text-canvas hover:bg-canvas hover:text-ink',
      },
      size: {
        sm: 'min-h-11 px-3 text-base',
        md: 'min-h-11 px-5 text-lg',
        lg: 'min-h-14 px-6 text-xl',
      },
      // Cargando y deshabilitado son estados distintos y tienen que verse distintos: los dos
      // bloquean el click, pero «Publicando» está trabajando, no está no disponible.
      state: {
        idle: '',
        loading: '',
        disabled: 'opacity-50',
      },
    },
    // Texto subrayado, sin caja: con relleno a los costados quedaría corrido respecto del título
    // con el que se alinea.
    compoundVariants: [
      { variant: 'ghost', class: 'border-x-0 px-0' },
      { variant: 'ghost-danger', class: 'border-x-0 px-0' },
    ],
    defaultVariants: { variant: 'primary', size: 'md', state: 'idle' },
  },
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<VariantProps<typeof button>, 'state'> & {
    loading?: boolean
  }

export function Button({
  variant,
  size,
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
      className={cn(button({ variant, size, state }), className)}
      {...rest}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      ) : null}
      <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>
    </button>
  )
}

// El spinner va encima del texto, que queda invisible pero ocupando su lugar: el botón no cambia de
// ancho al cargar. La animación va en el div y no en el `svg`: varios browsers no aceleran por hardware las
// animaciones CSS sobre elementos SVG.
export function Spinner() {
  return (
    <div aria-hidden className="size-4 animate-[spin_var(--dur-spin)_linear_infinite]">
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="8" r="6" opacity="0.25" />
        <path d="M14 8a6 6 0 0 0-6-6" strokeLinecap="round" />
      </svg>
    </div>
  )
}
