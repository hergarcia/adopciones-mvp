import { cn } from '@/lib/cn'
import {
  BRAND_MARK_BOX,
  BRAND_PAD_OUTLINE,
  BRAND_PRINT_RIDGES,
  BRAND_PRINT_STROKE,
  BRAND_PRINT_TRANSFORM,
  BRAND_TOES,
  BrandMark,
} from '@/components/ui/brand-mark'

export type BrandEquationTexts = {
  paw: BrandTermTexts
  print: BrandTermTexts
  mark: BrandTermTexts
}

type BrandTermTexts = { title: string; note: string }

const VIEW_BOX = `${BRAND_MARK_BOX.x} ${BRAND_MARK_BOX.y} ${BRAND_MARK_BOX.width} ${BRAND_MARK_BOX.height}`

// Los tres dibujos van en la caja de la marca: así la huella digital queda a la altura de la
// almohadilla, donde termina.
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
      <path d={BRAND_PAD_OUTLINE} />
    </svg>
  )
}

function PrintDrawing() {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" focusable="false" className={DRAWING}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={BRAND_PRINT_STROKE}
        strokeLinecap="round"
        transform={BRAND_PRINT_TRANSFORM}
      >
        {BRAND_PRINT_RIDGES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}

function BrandTerm({ texts, children }: { texts: BrandTermTexts; children: React.ReactNode }) {
  return (
    // Tres filas compartidas (dibujo, nombre, nota): si un nombre ocupa dos renglones en el teléfono,
    // las notas de los tres siguen arrancando a la misma altura.
    <figure className="row-span-3 grid grid-rows-subgrid justify-items-center gap-3 text-center">
      <div className="flex w-full items-center justify-center">{children}</div>
      <figcaption className="row-span-2 grid grid-rows-subgrid gap-1">
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

// Los signos son de la vista: leídos, los tres pies de dibujo ya cuentan la suma.
type Props = {
  texts: BrandEquationTexts
  /** Lo que anuncia el lector de pantalla en lugar de la marca, el único dibujo que se lee. */
  markLabel: string
}

export function BrandEquation({ texts, markLabel }: Props) {
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
        <BrandMark
          version="principal"
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- un SVG inline en currentColor no puede ser un <img>; role="img" es su forma accesible
          role="img"
          aria-label={markLabel}
          aria-hidden={false}
          className={DRAWING}
        />
      </BrandTerm>
    </div>
  )
}
