import { Stamp } from '@/components/ui/stamp'

type Props = {
  /** Ya traducidos: la frase y el nivel con las palabras del sello de la ficha. */
  texts: { lead: string; level: string }
}

// En «Mis animales», lo que ven quienes quieren adoptar (historia #283): el mismo sello de la nota de
// quien publica en la ficha, sin el marco de un cartel, para que no compita con «Publicar un animal»
// ni con la invitación.
export function PublicationsLevelLine({ texts }: Props) {
  return (
    <p className="flex max-w-[var(--measure)] flex-wrap items-center gap-x-3 gap-y-2 text-base text-ink">
      <span>{texts.lead}</span>
      <Stamp tone="primary">{texts.level}</Stamp>
    </p>
  )
}
