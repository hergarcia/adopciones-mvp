import { cva } from 'class-variance-authority'

// El sello del cartel marca un estado (docs/10 §Recursos del cartel): el color va en el texto y el
// borde lo hereda. Yerba lo verificado, mate cocido cuando le toca actuar a alguien, gris lo que se
// cerró. `lg` es el sello de una pantalla cuyo estado es el logro, no una marca al costado.
const stamp = cva('sello', {
  variants: {
    tone: { primary: 'text-primary', warning: 'text-warning', muted: 'text-ink-muted' },
    size: { md: 'text-sm', lg: 'text-xl' },
  },
  defaultVariants: { size: 'md' },
})

export type StampTone = 'primary' | 'warning' | 'muted'

type Props = {
  tone: StampTone
  size?: 'md' | 'lg'
  children: React.ReactNode
}

export function Stamp({ tone, size, children }: Props) {
  return <span className={stamp({ tone, size })}>{children}</span>
}
