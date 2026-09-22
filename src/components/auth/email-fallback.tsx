import { button } from '@/components/ui/button'
import { ChevronDownIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

type Props = {
  label: string
  isOpen: boolean
  children: React.ReactNode
}

// La puerta de atrás del ingreso: el enlace por correo es para quien no tiene Google o no puede
// usarlo (el navegador de Instagram lo rechaza), así que no compite con el botón principal y
// aparece recién cuando se pide. Es un `details` nativo: abre y cierra sin JavaScript.
export function EmailFallback({ label, isOpen, children }: Props) {
  return (
    <details open={isOpen} className="group">
      <summary
        className={cn(
          button({ variant: 'ghost', size: 'sm' }),
          'cursor-pointer list-none [&::-webkit-details-marker]:hidden',
        )}
      >
        {label}
        <ChevronDownIcon className="size-4 transition-transform duration-[var(--dur-fast)] ease-out group-open:rotate-180" />
      </summary>
      <div className="mt-6">{children}</div>
    </details>
  )
}
