import { cva } from 'class-variance-authority'

// Desde 1024, la foto a la izquierda y el encabezado y el trabajo a la derecha, arriba del pliegue:
// una foto 4:5 a lo ancho de la hoja mediría el doble de alto que la ventana y dejaría la mitad
// derecha vacía (docs/10 §Pantallas anchas). Debajo de 1024, una columna; con `small`, la foto chica
// al lado del nombre, así las acciones quedan en la primera pantalla del teléfono.
// Con `aside`, desde 1024 una tercera columna desde la fila del nombre (historia #271): la última
// fila es la única flexible, así lo que mida el costado no corre el nombre ni el trabajo.
const grid = cva('grid gap-y-6 lg:items-start lg:gap-x-12', {
  variants: {
    photo: {
      small: 'grid-cols-[calc(var(--spacing)*28)_minmax(0,1fr)] gap-x-4',
      large: 'grid-cols-1',
    },
    aside: {
      false: 'lg:grid-rows-[auto_1fr]',
      true: 'lg:grid-rows-[auto_auto_1fr]',
    },
  },
  compoundVariants: [
    {
      photo: 'small',
      aside: false,
      class: 'lg:grid-cols-[var(--container-rail)_minmax(0,1fr)]',
    },
    {
      photo: 'small',
      aside: true,
      class: 'lg:grid-cols-[var(--container-rail)_minmax(0,1fr)_minmax(0,1fr)]',
    },
    { photo: 'large', class: 'lg:grid-cols-[var(--container-sheet)_minmax(0,1fr)]' },
  ],
})

const place = {
  small: {
    head: 'col-start-2 row-start-1 self-center lg:self-start',
    photo: 'col-start-1 row-start-1 lg:row-span-2',
    body: 'col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-2',
  },
  large: {
    head: 'lg:col-start-2 lg:row-start-1',
    photo: 'lg:col-start-1 lg:row-span-2 lg:row-start-1',
    body: 'lg:col-start-2 lg:row-start-2',
  },
} as const

// Debajo de 1024 el costado y lo que sigue van en la columna, separados del trabajo por
// `--space-8` como antes de partirla: el `gap-y-6` de la grilla más `pt-2`.
const withAside = {
  photo: 'col-start-1 row-start-1 lg:row-span-3',
  aside: 'col-span-2 pt-2 lg:col-span-1 lg:col-start-3 lg:row-span-3 lg:row-start-1 lg:pt-0',
  below: 'col-span-2 pt-2 lg:col-span-1 lg:col-start-2 lg:row-start-3',
} as const

type Common = {
  head: React.ReactNode
  picture: React.ReactNode
  children: React.ReactNode
  className?: string
}

type Props = Common &
  (
    | {
        /** `small` en la pantalla de un animal, donde manda la decisión. */
        photo: 'small'
        /** Desde 1024 en la tercera columna, a la altura del nombre; debajo, después del trabajo. */
        aside?: React.ReactNode
        /** Lo que sigue al trabajo en su misma columna, debajo del costado en el teléfono. Solo con `aside`. */
        below?: React.ReactNode
      }
    | {
        /** `large` donde las fotos se revisan: no queda lugar para una tercera columna. */
        photo: 'large'
        aside?: never
        below?: never
      }
  )

// Una pantalla de trabajo sobre un animal: su nombre, su foto y lo que se decide. El orden del DOM es
// el de lectura en los dos anchos: el nombre, la foto, el trabajo, el costado y lo que sigue.
export function PetWorkLayout({ photo, head, picture, children, className, aside, below }: Props) {
  const at = place[photo]
  const hasAside = aside !== undefined
  return (
    <div className={grid({ photo, aside: hasAside, className })}>
      <div className={at.head}>{head}</div>
      <div className={hasAside ? withAside.photo : at.photo}>{picture}</div>
      <div className={at.body}>{children}</div>
      {hasAside ? <div className={withAside.aside}>{aside}</div> : null}
      {hasAside && below !== undefined && below !== null ? (
        <div className={withAside.below}>{below}</div>
      ) : null}
    </div>
  )
}
