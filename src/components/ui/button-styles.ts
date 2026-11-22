import { cva } from 'class-variance-authority'

// Con caja o sin caja: las variantes salen de estas dos listas, así que una nueva no compila hasta
// estar en una, y sin caja no lleva relleno a los costados (`compoundVariants`).
const BOXED = ['primary', 'secondary', 'danger', 'tirita'] as const
const BARE = ['ghost', 'ghost-danger', 'icon'] as const
type Variant = (typeof BOXED)[number] | (typeof BARE)[number]

// `tirita` es la acción principal de la pantalla: una sola por pantalla (docs/10 §Componentes).
//
// Compartido con `LinkButton`: una acción que navega es un `a` y no un `button` (docs/10 §Piso de
// accesibilidad), y sin compartir las variantes cada enlace redibujaría el botón a mano.
export const button = cva(
  'afiche press relative inline-flex items-center border-2 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'border-ink bg-ink text-canvas hover:bg-canvas hover:text-ink',
        secondary: 'border-ink bg-canvas text-ink hover:bg-ink hover:text-canvas',
        ghost:
          'border-transparent text-ink underline decoration-2 underline-offset-4 hover:decoration-4',
        // La acción destructiva que todavía no es la confirmación: el disparador de «Borrar mi
        // cuenta» tiene que decir a qué lleva sin gritarlo, así que es texto y no un bloque rojo.
        'ghost-danger':
          'border-transparent text-accent underline decoration-2 underline-offset-4 hover:decoration-4',
        danger: 'border-accent bg-accent text-canvas hover:bg-canvas hover:text-accent',
        tirita: 'perforado w-full border-ink bg-ink text-canvas hover:bg-canvas hover:text-ink',
        // Un icono solo, sin caja ni subrayado: los 44 px del piso táctil también a lo ancho.
        icon: 'min-w-11 border-transparent text-ink',
      } satisfies Record<Variant, string>,
      size: {
        sm: 'min-h-11 text-base',
        md: 'min-h-11 text-lg',
        lg: 'min-h-14 text-xl',
      },
      // `start`: una opción a lo ancho entre varias, que se lee de izquierda a derecha y puede
      // partirse en dos renglones (las de «¿Qué te frena?»).
      align: {
        center: 'justify-center',
        start: 'justify-start text-left',
      },
      // Cargando y deshabilitado son estados distintos y tienen que verse distintos: los dos
      // bloquean el click, pero «Publicando» está trabajando, no está no disponible.
      state: {
        idle: '',
        loading: '',
        disabled: 'opacity-50',
      },
    },
    // El relleno a los costados es solo de los que tienen caja: el texto subrayado, con relleno,
    // quedaría corrido respecto del título con el que se alinea. Va acá y no en `size` porque `cn`
    // no resuelve conflictos: un `px-0` encima de un `px-5` no gana por venir después.
    compoundVariants: [
      { variant: [...BARE], class: 'border-x-0 px-0' },
      { variant: [...BOXED], size: 'sm', class: 'px-3' },
      { variant: [...BOXED], size: 'md', class: 'px-5' },
      { variant: [...BOXED], size: 'lg', class: 'px-6' },
    ],
    defaultVariants: { variant: 'primary', size: 'md', align: 'center', state: 'idle' },
  },
)
