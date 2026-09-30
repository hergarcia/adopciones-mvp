import { TextLink } from '@/components/ui/text-link'
import { cn } from '@/lib/cn'
import { publicPhotoPath, publicProfilePath } from '@/lib/profile/public-paths'
import { Avatar } from './avatar'

// Una lista de gente, no un muro de tarjetas: texto con divisores de `--color-line`. Cada fila cierra
// con su divisor, así la línea sigue a la columna cuando la lista se reparte en varias.
export function PersonList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <ul className={cn('border-t-2 border-line', className)}>{children}</ul>
}

type PersonRowProps = {
  person: { publicId: string; displayName: string; hasPhoto: boolean }
  /** Falso para una vista previa de enlace, que tomaría una de estas fotos como la del perfil. */
  showPhoto: boolean
  /** Ya traducido; vacío cuando la foto es decorativa. */
  photoAlt: string
  lazy?: boolean
  /** Lo que va debajo del nombre: la zona, desde cuándo, la pausa, la acción. */
  children: React.ReactNode
}

// Una persona reconocible sin abrir otra página: su foto o sus iniciales y su nombre, que lleva a su
// perfil. Sin prefetch: traer un perfil por adelantado contaría como una vista (research R10).
export function PersonRow({ person, showPhoto, photoAlt, lazy, children }: PersonRowProps) {
  const photoUrl = showPhoto && person.hasPhoto ? publicPhotoPath(person.publicId) : null
  return (
    <li className="flex items-start gap-4 border-b-2 border-line py-3">
      <Avatar displayName={person.displayName} url={photoUrl} alt={photoAlt} lazy={lazy} />
      <div className="flex flex-col items-start gap-1">
        <TextLink href={publicProfilePath(person.publicId)} prefetch={false} weight="medium">
          {person.displayName}
        </TextLink>
        {children}
      </div>
    </li>
  )
}
