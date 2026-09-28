import { cva } from 'class-variance-authority'
import type { IdentityPhotoKind } from '@/lib/verification/identity'

type Props = {
  kind: IdentityPhotoKind
  /** Ya traducido: cómo sacarla, en texto al lado del dibujo. */
  description: string
  /** Con la foto ya elegida el dibujo se achica: acerca la vista previa a «Enviar mi pedido». */
  compact?: boolean
}

// Lado a lado, cada dibujo se inclina para su lado, como dos papeles pegados a mano.
const taped = cva('cinta shrink-0 border-2 border-ink bg-canvas p-2', {
  variants: {
    kind: { front: '-rotate-[var(--tilt)]', selfie: 'rotate-[var(--tilt)]' },
  },
})

const drawing = cva(
  'w-auto fill-none stroke-ink transition-[height] duration-[var(--dur-base)] ease-out',
  { variants: { compact: { false: 'h-40', true: 'h-20' } } },
)

// Cómo sacar cada foto: un dibujo y no la foto de una persona real ni de una cédula de verdad
// (FR-005). Está pegado con cinta porque es eso, algo que alguien pegó al lado del hueco; el texto va
// afuera, porque lo pegado no lleva texto de lectura adentro (docs/10 §Recursos del cartel). Trazo de
// tinta con la foto de la cédula en yerba, como las ilustraciones de los vacíos.
export function PhotoExample({ kind, description, compact = false }: Props) {
  return (
    <div className="flex items-center gap-4 self-start">
      <div className={taped({ kind })}>
        <svg
          aria-hidden
          viewBox="0 0 120 160"
          className={drawing({ compact })}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {kind === 'front' ? <FrontDrawing /> : <SelfieDrawing />}
        </svg>
      </div>
      <p className="text-sm text-ink">{description}</p>
    </div>
  )
}

// La cédula entera y derecha dentro del visor de la cámara: los cuatro bordes a la vista, que es lo
// que hace que se lea.
function FrontDrawing() {
  return (
    <>
      <path d="M6 52V40h12M102 40h12v12M114 110v12h-12M18 122H6v-12" />
      <rect x="18" y="52" width="84" height="56" />
      <rect x="25" y="61" width="22" height="30" className="stroke-primary" />
      <path d="M55 66h38M55 76h30M55 86h34M25 99h68" />
    </>
  )
}

function SelfieDrawing() {
  return (
    <>
      <path d="M14 158c2-26 14-40 34-42h4c16 2 26 10 30 22" />
      <ellipse cx="50" cy="72" rx="22" ry="27" />
      <path d="M40 68h.01M60 68h.01M43 84c4 3 10 3 14 0" />
      <path d="M28 60c2-18 12-26 22-26s20 8 22 24" />
      <g transform="rotate(-6 96 84)">
        <rect x="76" y="66" width="38" height="26" className="fill-canvas" />
        <rect x="80" y="71" width="11" height="15" className="stroke-primary" />
        <path d="M96 74h13M96 81h9" />
      </g>
      <path d="M88 116c0-8 2-16 6-22l4-4" />
      <path d="M78 94c4 6 10 8 16 6" />
    </>
  )
}
