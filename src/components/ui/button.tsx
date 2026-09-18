import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// Variantes con cva, no con ternarios de clases (docs/08 §Props). Se hunde 1 px al presionar por la
// utilidad `press`; el spinner va adentro y el texto no cambia de largo, así el botón no salta.
const button = cva(
  'press inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors duration-[var(--dur-fast)] ease-out disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-canvas hover:bg-primary-hover',
        secondary: 'border border-line bg-canvas text-ink hover:bg-surface',
        ghost: 'text-primary hover:bg-primary-soft',
        danger: 'bg-accent text-canvas hover:brightness-95',
      },
      size: {
        sm: 'min-h-11 px-3 text-sm',
        md: 'min-h-11 px-4 text-base',
        lg: 'min-h-12 px-5 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & {
    loading?: boolean
  }

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled ?? loading}
      className={cn(button({ variant, size }), className)}
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
