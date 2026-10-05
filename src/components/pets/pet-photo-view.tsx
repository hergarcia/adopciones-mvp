import type { ComponentType, Ref } from 'react'
import { cn } from '@/lib/cn'
import type { PhotoSource } from '@/lib/pets/photo-source'

export type PetPhotoViewProps = {
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
  imageRef?: Ref<HTMLImageElement>
  /** Escondida hasta que llegue, para el fundido desde el borroso. */
  isHidden?: boolean
  onLoad?: () => void
  onError?: () => void
}

/**
 * La foto que va en la card: `PetPhoto`, con el fundido del cliente, o `PetPhotoView`, quieta. La
 * elige quien arma la pared, para que la portada no cargue el código de la otra (ver `PetWall`).
 */
export type PhotoComponent = ComponentType<
  Omit<PetPhotoViewProps, 'imageRef' | 'isHidden' | 'onLoad' | 'onError'>
>

// La foto sobre su ThumbHash (docs/10 §Fotos), sin estado: `PetPhoto` le suma el fundido en el
// cliente, y la portada la dibuja quieta desde el servidor, sin código que hidratar. El fondo es un
// data URL armado en el servidor: un valor dinámico real, por eso va en `style`.
export function PetPhotoView({
  source,
  alt,
  sizes,
  eager = false,
  priority = false,
  className,
  imageRef,
  isHidden = false,
  onLoad,
  onError,
}: PetPhotoViewProps) {
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
        ref={imageRef}
        src={source.src}
        srcSet={source.srcSet}
        sizes={sizes}
        alt={alt}
        width={source.width}
        height={source.height}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        onLoad={onLoad}
        onError={onError}
        className={cn(
          'size-full object-cover [color:transparent] transition-[opacity,scale] duration-[var(--dur-base)] ease-out',
          isHidden ? 'opacity-0' : 'opacity-100',
        )}
      />
    </div>
  )
}
