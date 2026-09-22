import { button } from '@/components/ui/button'
import { ChevronDownIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

type Props = {
  label: string
  isOpen: boolean
  children: React.ReactNode
}

// Un `details` nativo y no un desplegable de cliente: abre y cierra sin JavaScript.
export function EmailFallback({ label, isOpen, children }: Props) {
  return (
    <details open={isOpen} className="group">
      <summary
        className={cn(
          button({ variant: 'ghost', size: 'sm' }),
          'cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden',
        )}
      >
        {label}
        <ChevronDownIcon className="size-4 transition-transform duration-[var(--dur-fast)] ease-out group-open:rotate-180" />
      </summary>
      <div className="mt-6">{children}</div>
    </details>
  )
}
