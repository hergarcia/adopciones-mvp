import { cva } from 'class-variance-authority'

// El sello del cartel marca un estado (docs/10 §Recursos del cartel): el color va en el texto y el
// borde lo hereda. Yerba lo verificado, mate cocido cuando le toca actuar a alguien, gris lo que se
// cerró, tinta lo que está en espera sin urgencia. `lg` es el sello de una pantalla cuyo estado es el logro, no una marca al costado.
const stamp = cva('sello', {
  variants: {
    tone: {
      primary: 'text-primary',
      warning: 'text-warning',
      muted: 'text-ink-muted',
      ink: 'text-ink',
    },
    size: { md: 'text-sm', lg: 'text-xl' },
    falls: { true: 'caida', false: null },
  },
  defaultVariants: { size: 'md', falls: false },
})

export type StampTone = 'primary' | 'warning' | 'muted' | 'ink'

type Props = {
  tone: StampTone
  size?: 'md' | 'lg'
  /** Cae al aparecer (`.caida`): solo cuando la persona acaba de poner ese estado. */
  falls?: boolean
  /** El estado que marca, para la regla de la hoja que lo hace caer donde se cambió (`data-estado`). */
  state?: string
  children: React.ReactNode
}

export function Stamp({ tone, size, falls, state, children }: Props) {
  return (
    <span className={stamp({ tone, size, falls })} data-estado={state}>
      {children}
    </span>
  )
}
