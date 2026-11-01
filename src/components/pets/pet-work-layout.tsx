import { cva } from 'class-variance-authority'

// Desde 1024, la foto a la izquierda y el encabezado y el trabajo a la derecha, arriba del pliegue:
// una foto 4:5 a lo ancho de la hoja mediría el doble de alto que la ventana y dejaría la mitad
// derecha vacía (docs/10 §Pantallas anchas). Debajo de 1024, una columna; con `small`, la foto chica
// al lado del nombre, así las acciones quedan en la primera pantalla del teléfono.
const grid = cva('grid gap-y-6 lg:items-start lg:gap-x-12', {
  variants: {
    photo: {
      small:
        'grid-cols-[calc(var(--spacing)*28)_minmax(0,1fr)] gap-x-4 lg:grid-cols-[var(--container-rail)_minmax(0,1fr)]',
      large: 'grid-cols-1 lg:grid-cols-[var(--container-sheet)_minmax(0,1fr)]',
    },
    // Con `aside`, una tercera fila: el riel debajo de la foto deja de quedar vacío (historia #269).
    rows: {
      two: 'lg:grid-rows-[auto_1fr]',
      three: 'lg:grid-rows-[auto_auto_1fr]',
    },
  },
})

const place = {
  small: {
    head: 'col-start-2 row-start-1 self-center lg:self-start',
    photo: 'col-start-1 row-start-1 lg:row-span-2',
    body: 'col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-2',
    aside: 'col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-3 lg:self-start',
    rest: 'col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-3',
  },
  large: {
    head: 'lg:col-start-2 lg:row-start-1',
    photo: 'lg:col-start-1 lg:row-span-2 lg:row-start-1',
    body: 'lg:col-start-2 lg:row-start-2',
  },
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
        /** Debajo del trabajo en el teléfono; desde 1024, en el riel, debajo de la foto. */
        aside?: React.ReactNode
        /** Lo que sigue al trabajo: debajo de `aside` en el teléfono, al lado desde 1024. */
        rest?: React.ReactNode
      }
    | { /** `large` donde las fotos se revisan. */ photo: 'large'; aside?: never; rest?: never }
  )

// Una pantalla de trabajo sobre un animal: su nombre, su foto y lo que se decide. El orden del DOM es
// el de lectura en los dos anchos: el nombre, la foto, el trabajo, y después `aside` y `rest`.
export function PetWorkLayout(props: Props) {
  const { photo, head, picture, children, className } = props
  if (photo === 'large' || (props.aside === undefined && props.rest === undefined)) {
    const at = place[photo]
    return (
      <div className={grid({ photo, rows: 'two', className })}>
        <div className={at.head}>{head}</div>
        <div className={at.photo}>{picture}</div>
        <div className={at.body}>{children}</div>
      </div>
    )
  }
  const at = place.small
  return (
    <div className={grid({ photo, rows: 'three', className })}>
      <div className={at.head}>{head}</div>
      <div className={at.photo}>{picture}</div>
      <div className={at.body}>{children}</div>
      {props.aside === undefined ? null : <div className={at.aside}>{props.aside}</div>}
      {props.rest === undefined ? null : <div className={at.rest}>{props.rest}</div>}
    </div>
  )
}
