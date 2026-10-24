import { cn } from '@/lib/cn'
import { BRAND_MARK_BOX, BRAND_TOES, BrandMark } from '@/components/ui/brand-mark'

export type BrandEquationTexts = {
  paw: BrandTermTexts
  print: BrandTermTexts
  mark: BrandTermTexts
}

type BrandTermTexts = { title: string; note: string }

const VIEW_BOX = `${BRAND_MARK_BOX.x} ${BRAND_MARK_BOX.y} ${BRAND_MARK_BOX.width} ${BRAND_MARK_BOX.height}`

// Los dos dibujos que se suman salen de la hoja de marca, en la misma caja que la marca: así la
// huella digital queda a la altura de la almohadilla, donde termina.
const PAD_OUTLINE =
  'M60 44.5C77 44.5 93.6 59 93.6 76.5C93.6 91 82 101.1 60 101.1C38 101.1 26.4 91 26.4 76.5C26.4 59 43 44.5 60 44.5Z'

const PRINT_RIDGES = [
  'M56.4 85C56.4 81.83 56.4 78.67 56.4 75.5A3.6 3.6 0 0 1 63.6 75.5C63.6 78.17 63.6 80.83 63.6 83.5',
  'M47.9 90.5C48.9 85.5 49.4 80.5 49.4 75.5A10.6 10.6 0 0 1 70.6 75.5C70.6 80.17 70.87 84.83 71.4 89.5',
  'M39.4 91.5C41.4 86.17 42.4 80.83 42.4 75.5A17.6 17.6 0 0 1 77.6 75.5C77.6 80.83 78.33 86.17 79.8 91.5',
  'M37.19 84.72A24.6 24.6 0 0 1 73.76 55.11',
  'M78.28 59.04A24.6 24.6 0 0 1 83.12 67.09',
]

const DRAWING = 'h-auto w-full max-w-28 text-ink'

function PawDrawing() {
  return (
    <svg
      viewBox={VIEW_BOX}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={DRAWING}
    >
      {BRAND_TOES.map((d) => (
        <path key={d} d={d} />
      ))}
      <path d={PAD_OUTLINE} />
    </svg>
  )
}

function PrintDrawing() {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" focusable="false" className={DRAWING}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        transform="rotate(-13 60 75.5)"
      >
        {PRINT_RIDGES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}

function BrandTerm({ texts, children }: { texts: BrandTermTexts; children: React.ReactNode }) {
  return (
    <figure className="row-span-2 grid grid-rows-subgrid justify-items-center gap-3 text-center">
      <div className="flex w-full items-center justify-center">{children}</div>
      <figcaption className="flex flex-col gap-1">
        <span className="afiche text-lg text-ink">{texts.title}</span>
        <span className="text-sm text-ink-muted">{texts.note}</span>
      </figcaption>
    </figure>
  )
}

// Signos, no texto: van iguales en cualquier idioma. Con fila y columna fijas, porque con la fila
// sola la grilla los pondría primero, en las dos primeras columnas.
const OPERATORS = {
  plus: { sign: '+', column: 'col-start-2' },
  equals: { sign: '=', column: 'col-start-4' },
} as const

function Operator({ kind }: { kind: keyof typeof OPERATORS }) {
  return (
    <span
      aria-hidden="true"
      className={cn('afiche row-start-1 self-center text-3xl text-ink', OPERATORS[kind].column)}
    >
      {OPERATORS[kind].sign}
    </span>
  )
}

// La pata más la huella digital da la marca. Los signos son de la vista: leídos, los tres pies de
// dibujo ya cuentan la suma.
export function BrandEquation({ texts }: { texts: BrandEquationTexts }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2 sm:gap-x-4">
      <BrandTerm texts={texts.paw}>
        <PawDrawing />
      </BrandTerm>
      <Operator kind="plus" />
      <BrandTerm texts={texts.print}>
        <PrintDrawing />
      </BrandTerm>
      <Operator kind="equals" />
      <BrandTerm texts={texts.mark}>
        <BrandMark version="principal" className={DRAWING} />
      </BrandTerm>
    </div>
  )
}
