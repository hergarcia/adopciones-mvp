'use client'

import { useEffect, useRef, useState } from 'react'
import { PetPhotoView, type PetPhotoViewProps } from './pet-photo-view'

type Props = Omit<PetPhotoViewProps, 'imageRef' | 'isHidden' | 'onLoad' | 'onError'>

type Status = 'shown' | 'waiting' | 'failed'

// Sale visible desde el servidor: sin ejecutar nada se ve igual (FR-019), y la portada cuenta para
// el LCP sin esperar a hidratar. El fundido desde el borroso queda para las `lazy` que todavía no
// llegaron al hidratar.
export function PetPhoto(props: Props) {
  const { eager = false } = props
  const image = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<Status>('shown')

  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    if (!eager && image.current?.complete === false) setStatus('waiting')
  }, [eager])
  /* eslint-enable react/set-state-in-effect */

  return (
    <PetPhotoView
      {...props}
      imageRef={image}
      isHidden={status !== 'shown'}
      onLoad={() => setStatus('shown')}
      onError={() => setStatus('failed')}
    />
  )
}
