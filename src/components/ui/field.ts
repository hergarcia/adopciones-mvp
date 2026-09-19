import { cva } from 'class-variance-authority'

// `line` es el renglón (Input, Select) y `box` el recuadro (Textarea). En el renglón el indicador
// de foco es la línea, que la sombra engrosa sin mover el layout: un anillo dibujaría una caja
// alrededor de un campo que no la tiene (docs/10 §Piso de accesibilidad). 16 px como mínimo para
// que iOS no haga zoom al enfocar.
export const field = cva('text-base text-ink placeholder:text-ink-muted disabled:opacity-50', {
  variants: {
    shape: {
      line: 'min-h-11 border-0 border-b-2 bg-transparent px-0 transition-shadow duration-[var(--dur-fast)] ease-out focus-visible:outline-none',
      box: 'min-h-24 border-2 bg-canvas p-3',
    },
    error: {
      true: 'border-accent',
      false: 'border-ink',
    },
  },
  compoundVariants: [
    { shape: 'line', error: false, class: 'focus:shadow-[0_2px_0_0_var(--color-ink)]' },
    { shape: 'line', error: true, class: 'focus:shadow-[0_2px_0_0_var(--color-accent)]' },
  ],
  defaultVariants: { shape: 'line', error: false },
})
