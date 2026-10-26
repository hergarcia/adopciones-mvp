import { cva } from 'class-variance-authority'

const line = cva('text-ink', {
  variants: { size: { base: 'text-base font-bold', lg: 'text-lg' } },
  defaultVariants: { size: 'lg' },
})

// «4 crías, 2 disponibles»: en la ficha y en el panel, `lg`; debajo de la camada en «Mis animales»,
// `base` (plan §Diseño).
export function LitterCountLine({ text, size }: { text: string; size?: 'base' | 'lg' }) {
  return <p className={line({ size })}>{text}</p>
}
