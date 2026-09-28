import { cn } from '@/lib/cn'

// «Rescatista» es una etiqueta informativa con borde de tinta y no un sello: el sello marca un
// **estado** y esto es un atributo que no cambia solo. Tampoco va en yerba: el verde y la
// prominencia son de la chapita de verificación (docs/10 §Principios 2, §Recursos). La usan el
// perfil propio y la nota del publicador en la ficha.
export function RescuerTag({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn('border-2 border-ink px-2 py-0.5 text-sm text-ink', className)}>
      {label}
    </span>
  )
}
