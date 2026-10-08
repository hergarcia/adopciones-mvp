import Link from 'next/link'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationPetPhoto } from './application-pet-photo'

export const APPLICATION_CARD_SIZES = '(min-width: 1024px) 320px, (min-width: 768px) 30vw, 45vw'

type Props = {
  href: string
  cover: PetPhotoData | null
  /** Su lugar en la pared: alterna el lado de la inclinación. */
  index: number
  /** El sello apoyado sobre la foto, o nada. */
  stamp: React.ReactNode
  /** `false` donde abrir la pantalla registra algo: traerla por adelantado la contaría. */
  prefetch?: boolean
  /** Ya traducidos: el nombre, lo que le toca hacer a quien mira y las líneas chicas de debajo. */
  texts: { name: string; photoAlt: string; alert?: string | null; lines: (string | null)[] }
  /** Lo que va debajo de la card, fuera del enlace. */
  below?: React.ReactNode
}

// El animal de una solicitud pegado en la pared (docs/10, `PetCard`): la foto manda, el sello encima
// y el nombre debajo, con lo que haga falta en `--text-sm`. La card entera es el enlace. La componen
// `MyApplicationCard` y `InboxPetCard`.
export function PastedApplicationCard({
  href,
  cover,
  index,
  stamp,
  prefetch,
  texts,
  below,
}: Props) {
  return (
    <li className="flex flex-col items-start gap-1">
      <Link
        href={href}
        prefetch={prefetch}
        className="lift group flex w-full flex-col gap-2 p-1 [--lift-tilt:0deg]"
      >
        <ApplicationPetPhoto
          cover={cover}
          alt={texts.photoAlt}
          side={index % 2 === 0 ? 'left' : 'right'}
          sizes={APPLICATION_CARD_SIZES}
          eager={index < 4}
          photoClassName="[&>img]:group-hover:scale-[1.03]"
          stamp={stamp}
        />
        <p className="afiche mt-1 text-lg break-words text-ink">{texts.name}</p>
        {texts.alert ? <p className="text-sm font-medium text-warning">{texts.alert}</p> : null}
        {texts.lines.map((line) =>
          line === null ? null : (
            <p key={line} className="text-sm text-ink-muted tabular-nums">
              {line}
            </p>
          ),
        )}
      </Link>
      {below}
    </li>
  )
}
