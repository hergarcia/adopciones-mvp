'use client'

import { useEffect, useRef } from 'react'

const ABANDON_PATH = '/api/solicitudes/abandono'

// Quien deja el cuestionario sin enviar (research R11): al cerrarse o esconderse la página, o al irse
// a otra pantalla del sitio, un beacon con la última pregunta contestada. El beacon es lo único que
// sale aunque la página se esté yendo; nada de la persona viaja con él.
export function useAbandonBeacon(lastQuestion: () => string | null) {
  const sent = useRef(false)
  const last = useRef(lastQuestion)
  useEffect(() => {
    last.current = lastQuestion
  })

  useEffect(() => {
    function leave() {
      if (sent.current) return
      sent.current = true
      try {
        navigator.sendBeacon(
          ABANDON_PATH,
          JSON.stringify({ lastQuestion: last.current() ?? 'none' }),
        )
      } catch {
        // Sin beacon no se mide: la persona no pierde nada.
      }
    }
    window.addEventListener('pagehide', leave)
    return () => {
      window.removeEventListener('pagehide', leave)
      leave()
    }
  }, [])

  // Enviada, no es un abandono.
  return { done: () => void (sent.current = true) }
}
