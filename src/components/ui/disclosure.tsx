import { cn } from '@/lib/cn'
import { button } from './button'
import { ChevronDownIcon } from './icons'

type Props = {
  /** Ya traducido: lo que se despliega. */
  label: string
  open?: boolean
  /** `option`: el disparador es una opción a lo ancho entre otras, con el mismo peso que ellas. */
  variant?: 'ghost' | 'option'
  children: React.ReactNode
}

const TRIGGER = {
  ghost: button({ variant: 'ghost', size: 'sm' }),
  option: cn(button({ variant: 'secondary', align: 'start' }), 'w-full py-2'),
}

// Un `details` nativo y no un desplegable de cliente: abre y cierra sin JavaScript. El disparador es
// un `ghost`, o una opción a lo ancho entre otras, con el chevron que gira al abrir.
export function Disclosure({ label, open, variant = 'ghost', children }: Props) {
  return (
    <details open={open} className="group/disclosure">
      <summary
        className={cn(
          TRIGGER[variant],
          'cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden',
        )}
      >
        {label}
        <span
          aria-hidden
          className="ml-auto shrink-0 transition-transform duration-[var(--dur-fast)] ease-out group-open/disclosure:rotate-180"
        >
          <ChevronDownIcon />
        </span>
      </summary>
      {children}
    </details>
  )
}
