'use client'

import { useEffect, useState } from 'react'

export type ImageStatus = 'loading' | 'ready' | 'failed'

// Se pide aparte y no con el `onLoad` del `img`: una imagen que llega antes de hidratar ya disparó
// el evento cuando React lo empieza a escuchar, y la pantalla se quedaría cargando para siempre.
// Sin referrer, igual que en `Avatar`, para que el pedido sea el mismo y la segunda vez salga de la
// caché.
export function useImageStatus(url: string): ImageStatus {
  const [status, setStatus] = useState<ImageStatus>('loading')

  useEffect(() => {
    const image = new Image()
    image.referrerPolicy = 'no-referrer'
    image.onload = () => setStatus('ready')
    image.onerror = () => setStatus('failed')
    image.src = url
    return () => {
      image.onload = null
      image.onerror = null
    }
  }, [url])

  return status
}
