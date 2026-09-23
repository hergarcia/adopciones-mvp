import { cn } from '@/lib/cn'
import { avatarContent } from '@/lib/profile/avatar-display'

type Props = {
  displayName: string
  /** URL firmada de vida corta, o null cuando no hay foto. */
  url: string | null
  /** Ya traducido. */
  alt: string
  size?: 'md' | 'lg'
  className?: string
}

// Solo pinta: la decisión de foto o iniciales vive en `avatarContent`, con su test. Cuadrado como
// todo acá, que lo único redondo del sistema es la chapita (docs/10 §Antipatrones).
export function Avatar({ displayName, url, alt, size = 'md', className }: Props) {
  const content = avatarContent(url, displayName)

  return (
    <span
      className={cn(
        'afiche grid shrink-0 place-items-center overflow-hidden border-2 border-ink bg-surface text-ink',
        size === 'lg' ? 'size-24 text-2xl' : 'size-12 text-base',
        className,
      )}
    >
      {content.kind === 'initials' ? (
        <span aria-hidden>{content.text}</span>
      ) : (
        // La URL es firmada y de vida corta, así que no pasa por el optimizador de Next: lo
        // cachearía con la firma adentro y serviría una imagen que ya no vale. Sin referrer porque
        // la foto de Google responde 429 a un pedido que dice desde qué página viene.
        // eslint-disable-next-line next/no-img-element
        <img
          src={content.url}
          alt={alt}
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      )}
    </span>
  )
}
