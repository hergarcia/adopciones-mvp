import { cn } from '@/lib/cn'

// «Rescatista» es un atributo que no cambia solo, así que no es un sello (el sello marca un
// **estado**), ni va en yerba: el verde y la prominencia son de la chapita de verificación
// (docs/10 §Principios 2). Tampoco lleva borde: una caja de tinta de 2 px es la forma de los
// botones, y al lado de «Compartir» se leía como uno más (docs/10 §Principios 5).
export function RescuerTag({ label, className }: { label: string; className?: string }) {
  return <span className={cn('text-sm text-ink-muted', className)}>{label}</span>
}
