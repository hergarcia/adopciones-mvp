import { TextLink } from '@/components/ui/text-link'

type Props = {
  /** Ya traducida: «Cría 1, hembra». */
  line: string
  /** Sus solicitudes, con «2 solicitudes nuevas» o «Ver solicitudes»; null si nadie la pidió. */
  inbox: { href: string; label: string } | null
}

// Una cría de la camada en «Mis animales» (FR-026): su nombre y, si la pidieron, el camino a sus
// solicitudes con cuántas son nuevas, como el de un animal en `MyPetActions`. Sin precarga: abrirlas
// las da por vistas.
export function YoungRow({ line, inbox }: Props) {
  return (
    <li className="flex flex-col items-start">
      <span className="text-sm break-words text-ink-muted">{line}</span>
      {inbox === null ? null : (
        <TextLink href={inbox.href} prefetch={false} weight="medium">
          {inbox.label}
        </TextLink>
      )}
    </li>
  )
}
