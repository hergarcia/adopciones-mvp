'use client'

import { useEffect, useRef } from 'react'

const FAILED = 'data-failed'

const isBroken = (image: HTMLImageElement) =>
  image.complete && image.naturalWidth === 0 && image.currentSrc !== ''

function markFailures(element: HTMLElement): () => void {
  for (const image of element.querySelectorAll('img')) {
    if (isBroken(image)) image.setAttribute(FAILED, '')
  }
  const onError = (event: Event) => {
    if (event.target instanceof HTMLImageElement) event.target.setAttribute(FAILED, '')
  }
  const onLoad = (event: Event) => {
    if (event.target instanceof HTMLImageElement) event.target.removeAttribute(FAILED)
  }
  element.addEventListener('error', onError, true)
  element.addEventListener('load', onLoad, true)
  return () => {
    element.removeEventListener('error', onError, true)
    element.removeEventListener('load', onLoad, true)
  }
}

// Las fotos quietas de `PetPhotoView` no tienen `onError`: una que no carga —la firma venció, el
// almacenamiento falló— mostraría el ícono roto del navegador encima del borroso (FR-020). Una sola
// hoja para toda la pared, sin estado: marca la que falló y la vuelve a mostrar si otra dirección
// llega. Las que fallaron antes de hidratar ya no avisan, por eso se miran al montar.
export function FailedPhotosGuard({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => (root.current === null ? undefined : markFailures(root.current)), [])

  return (
    <div ref={root} className="contents">
      {children}
    </div>
  )
}
