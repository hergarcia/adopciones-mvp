'use client'

import { useEffect, useState } from 'react'

export type ImageStatus = 'loading' | 'ready' | 'failed'

// Se pide aparte y no con el `onLoad` del `img`: una imagen que llega antes de hidratar ya disparó
// el evento cuando React lo empieza a escuchar, y la pantalla se quedaría cargando para siempre.
// Sin referrer, igual que en `Avatar`, para que el pedido sea el mismo y la segunda vez salga de la
// caché. El resultado se guarda con su dirección: al cambiar la dirección —volver a pedirla— el
// estado es «cargando» hasta que esa llegue, y no el de la anterior.
export function useImageStatus(url: string): ImageStatus {
  const [result, setResult] = useState<{ url: string; status: ImageStatus } | null>(null)

  useEffect(() => {
    const image = new Image()
    image.referrerPolicy = 'no-referrer'
    image.onload = () => setResult({ url, status: 'ready' })
    image.onerror = () => setResult({ url, status: 'failed' })
    image.src = url
    return () => {
      image.onload = null
      image.onerror = null
    }
  }, [url])

  return result?.url === url ? result.status : 'loading'
}
