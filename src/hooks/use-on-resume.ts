import { useEffect, useEffectEvent } from 'react'

// La persona retoma la pestaña: vuelve a verla, o el navegador la repone desde atrás/adelante.
export function useOnResume(onResume: () => void) {
  const resume = useEffectEvent(() => {
    if (document.visibilityState === 'visible') onResume()
  })

  useEffect(() => {
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('pageshow', resume)
    return () => {
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('pageshow', resume)
    }
  }, [])
}
