import { useEffect, useEffectEvent, useRef } from 'react'

/**
 * Lo escrito en un campo que dibujó el servidor y despertó después (historia #304): el texto quedó
 * en la pantalla pero no en el estado, y el próximo dibujo lo borraba. Al despertar, si el campo
 * tiene texto y el estado está vacío, lo adopta.
 */
export function useKeepTyped<E extends HTMLInputElement | HTMLTextAreaElement>(
  value: string,
  onChange: (value: string) => void,
) {
  const ref = useRef<E>(null)
  const adopt = useEffectEvent(() => {
    const typed = ref.current?.value ?? ''
    if (value === '' && typed !== '') onChange(typed)
  })

  useEffect(() => {
    adopt()
  }, [])

  return ref
}
