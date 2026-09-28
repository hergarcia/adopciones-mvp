import { cva } from 'class-variance-authority'

// La tira de papel de los avisos: borde de tinta y la banda de 8 px a la izquierda, yerba si salió
// bien, ceibo si no (docs/10 §Espacio). Vive una sola vez para que el `Toast` y el aviso quieto de
// un formulario no se separen.
export const paperStrip = cva('border-2 border-l-8 border-ink bg-canvas p-4 text-base text-ink', {
  variants: {
    band: {
      success: 'border-l-primary',
      error: 'border-l-accent',
    },
  },
  defaultVariants: { band: 'success' },
})
