import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// Un bloque de tinta en voz de afiche, como el marcador grueso del cartel. Al hover se invierte,
// como un negativo fotocopiado. `tirita` es la acción principal de la pantalla, con el borde
// perforado arriba: una sola por pantalla (docs/10 §Componentes).
const button = cva(
  'afiche press inline-flex items-center justify-center gap-2 border-2 transition-colors duration-[var(--dur-fast)] ease-out disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'border-ink bg-ink text-canvas hover:bg-canvas hover:text-ink',
        secondary: 'border-ink bg-canvas text-ink hover:bg-ink hover:text-canvas',
        ghost:
          'border-transparent text-ink underline decoration-2 underline-offset-4 hover:bg-surface',
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
      {loading ? <Spinner /> : null}
      {children}
    </button>
  )
}

// La animación va en el div y no en el `svg`: varios browsers no aceleran por hardware las
// animaciones CSS sobre elementos SVG.
function Spinner() {
  return (
    <div aria-hidden className="size-4 animate-spin">
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="8" r="6" opacity="0.25" />
        <path d="M14 8a6 6 0 0 0-6-6" strokeLinecap="round" />
      </svg>
    </div>
  )
}
