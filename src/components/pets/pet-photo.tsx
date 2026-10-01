'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import type { PhotoSource } from '@/lib/pets/photo-source'

type Props = {
  source: PhotoSource
  /** Ya traducido. */
  alt: string
  sizes: string
  /** Las primeras de la pantalla cargan de entrada; el resto, cuando se acercan. */
  eager?: boolean
  /** Solo la portada de la ficha: es lo que mide el LCP. */
  priority?: boolean
  /** La caja que la recorta, con su proporción (4:5, la de la pared). */
  className?: string
}

type Status = 'shown' | 'waiting' | 'failed'

// La foto sobre su ThumbHash (docs/10 §Fotos). Sale visible desde el servidor: sin ejecutar nada
// se ve igual (FR-019), y la portada cuenta para el LCP sin esperar a hidratar. El fundido desde el
// borroso queda para las `lazy` que todavía no llegaron al hidratar. El fondo es un data URL armado
// en el servidor: un valor dinámico real, por eso va en `style`.
export function PetPhoto({
  source,
  alt,
  sizes,
  eager = false,
  priority = false,
  className,
}: Props) {
  const image = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<Status>('shown')

  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    if (!eager && image.current?.complete === false) setStatus('waiting')
  }, [eager])
  /* eslint-enable react/set-state-in-effect */

  return (
    <div
      className={cn('overflow-hidden bg-surface bg-cover bg-center', className)}
      style={source.placeholder ? { backgroundImage: `url(${source.placeholder})` } : undefined}
    >
      {/* Las URLs son firmadas y cambian en cada carga: el optimizador de Next guardaría una copia
          por firma, y el WebP ya viene del tamaño justo. El `alt` transparente: si la foto no
          carga queda el borroso, sin el texto encima (spec §Pantallas). */}
      {/* eslint-disable-next-line next/no-img-element */}
      <img
        ref={image}
        src={source.src}
        srcSet={source.srcSet}
        sizes={sizes}
        alt={alt}
        width={source.width}
        height={source.height}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        onLoad={() => setStatus('shown')}
        onError={() => setStatus('failed')}
        className={cn(
          'size-full object-cover [color:transparent] transition-[opacity,scale] duration-[var(--dur-base)] ease-out',
          status === 'shown' ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}
