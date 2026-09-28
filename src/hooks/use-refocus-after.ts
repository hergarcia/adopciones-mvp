'use client'

import { useCallback, useEffect, useEffectEvent, useRef } from 'react'

// El botón que se toca se desmonta mientras algo carga y el foco se cae con él. `arm()` se llama al
// tocarlo; cuando `busy` vuelve a falso, el foco pasa a lo que elija `pickTarget` con la pantalla
// que quedó, que puede ser otra según cómo salió.
export function useRefocusAfter(busy: boolean, pickTarget: () => HTMLElement | null): () => void {
  const armed = useRef(false)
  const focusTarget = useEffectEvent(() => pickTarget()?.focus())

  useEffect(() => {
    if (busy || !armed.current) return
    armed.current = false
    focusTarget()
  }, [busy])

  return useCallback(() => {
    armed.current = true
  }, [])
}
