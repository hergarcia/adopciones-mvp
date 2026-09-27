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
  /** La caja que la recorta, con su proporción (4:5 en la card, 1:1 en el formulario). */
  className?: string
}

// La foto sobre su ThumbHash, que se va con un fundido cuando la foto llega (docs/10 §Fotos). El
// fondo es un data URL armado en el servidor: un valor dinámico real, por eso va en `style`. Con su
// propio `onLoad` y no con `useImageStatus`, que bajaría una segunda copia.
export function PetPhoto({ source, alt, sizes, eager = false, className }: Props) {
  const image = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)

  // Una foto que llegó antes de hidratar ya disparó `load` cuando React empieza a escuchar.
  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    if (image.current?.complete) setLoaded(true)
  }, [])
  /* eslint-enable react/set-state-in-effect */

  return (
    <div
      className={cn('overflow-hidden bg-surface bg-cover bg-center', className)}
      style={source.placeholder ? { backgroundImage: `url(${source.placeholder})` } : undefined}
    >
      {/* Las URLs son firmadas y cambian en cada carga: el optimizador de Next guardaría una copia
          por firma, y el WebP ya viene del tamaño justo (research R4). */}
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
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          'size-full object-cover transition-[opacity,scale] duration-[var(--dur-base)] ease-out',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}
