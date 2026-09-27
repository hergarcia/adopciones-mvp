import { UrgentIcon } from '@/components/ui/icons'

// Texto plano con su icono, sin fondo: es el único acento de la pared (docs/10, `UrgencyTag`).
export function UrgencyTag({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-1 text-sm font-medium text-accent">
      <UrgentIcon />
      {label}
    </p>
  )
}
