import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// Con caja o sin caja: las variantes salen de estas dos listas, así que una nueva no compila hasta
// estar en una, y sin caja no lleva relleno a los costados (`compoundVariants`).
const BOXED = ['primary', 'secondary', 'danger', 'tirita'] as const
const BARE = ['ghost', 'ghost-danger', 'icon'] as const
type Variant = (typeof BOXED)[number] | (typeof BARE)[number]

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
        // Un icono solo, sin caja ni subrayado: los 44 px del piso táctil también a lo ancho.
        icon: 'min-w-11 border-transparent text-ink',
      } satisfies Record<Variant, string>,
      size: {
        sm: 'min-h-11 text-base',
        md: 'min-h-11 text-lg',
        lg: 'min-h-14 text-xl',
      },
      // Cargando y deshabilitado son estados distintos y tienen que verse distintos: los dos
      // bloquean el click, pero «Publicando» está trabajando, no está no disponible.
      state: {
        idle: '',
        loading: '',
        disabled: 'opacity-50',
      },
    },
    // El relleno a los costados es solo de los que tienen caja: el texto subrayado, con relleno,
    // quedaría corrido respecto del título con el que se alinea. Va acá y no en `size` porque `cn`
    // no resuelve conflictos: un `px-0` encima de un `px-5` no gana por venir después.
    compoundVariants: [
      { variant: [...BARE], class: 'border-x-0 px-0' },
      { variant: [...BOXED], size: 'sm', class: 'px-3' },
      { variant: [...BOXED], size: 'md', class: 'px-5' },
      { variant: [...BOXED], size: 'lg', class: 'px-6' },
    ],
    defaultVariants: { variant: 'primary', size: 'md', state: 'idle' },
  },
)

type Props = React.ComponentProps<'button'> &
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
