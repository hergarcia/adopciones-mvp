import { TextLink } from '@/components/ui/text-link'
import { LitterCountLine } from './litter-count-line'

type Props = {
  /** Ya traducido: «4 crías, 2 disponibles». */
  count: string
  /** El panel de la camada, con todo a la vista, y su texto. */
  panel: { href: string; label: string }
  /** Una `YoungRow` por cría, en el orden de la camada. */
  children: React.ReactNode
}

// Debajo de una camada en «Mis animales» (historia #206, research R9): cuántas crías tiene y cuántas
// están disponibles, una fila por cría y el camino a su panel. Sin miniaturas: la foto de la pared ya
// es la de la camada.
export function YoungRows({ count, panel, children }: Props) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <LitterCountLine text={count} size="base" />
      <ul className="flex flex-col divide-y divide-line">{children}</ul>
      <TextLink href={panel.href} weight="medium">
        {panel.label}
      </TextLink>
    </div>
  )
}
