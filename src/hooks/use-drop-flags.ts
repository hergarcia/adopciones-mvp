'use client'

import { useEffect } from 'react'
import { VOUCH_FLAG, VOUCH_NONCE } from '@/lib/vouches/paths'

// Las marcas que deja una acción en la dirección para el aviso de la pantalla a la que se llega. Salen
// de la URL apenas se muestran: si se quedan, un F5 —o compartir el enlace— vuelve a anunciar algo
// que nadie hizo.
const FLAGS = ['guardado', 'error', VOUCH_FLAG, VOUCH_NONCE]

export function useDropFlags(): void {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (!FLAGS.some((flag) => url.searchParams.has(flag))) return
    for (const flag of FLAGS) url.searchParams.delete(flag)
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
  }, [])
}
