import { cn } from '@/lib/cn'
import { button } from './button'
import { ChevronDownIcon } from './icons'

type Props = {
  /** Ya traducido: lo que se despliega. */
  label: string
  open?: boolean
  children: React.ReactNode
}

// Un `details` nativo y no un desplegable de cliente: abre y cierra sin JavaScript. El disparador es
// un `ghost` con el chevron que gira al abrir.
export function Disclosure({ label, open, children }: Props) {
  return (
    <details open={open} className="group/disclosure">
      <summary
        className={cn(
          button({ variant: 'ghost', size: 'sm' }),
          'cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden',
        )}
      >
        {label}
        <span
          aria-hidden
          className="transition-transform duration-[var(--dur-fast)] ease-out group-open/disclosure:rotate-180"
        >
          <ChevronDownIcon />
        </span>
      </summary>
      {children}
    </details>
  )
}
