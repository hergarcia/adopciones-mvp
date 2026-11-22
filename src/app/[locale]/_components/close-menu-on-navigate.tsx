'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// La cabecera sigue montada al navegar, así que el menú de la cuenta se cierra solo: al tocar uno de
// sus enlaces, también si lleva a la misma pantalla o solo cambia la consulta, y al cambiar de
// pantalla con atrás y adelante (con la pantalla como `key`, se vuelve a montar y lo cierra).
// Un enlace que se apaga mientras abre (`data-answers-tap`, «Opinar») deja el menú abierto hasta que
// cambia la pantalla: cerrado al tocarlo, nadie veía que estaba abriendo (historia #352).
export function CloseMenuOnNavigate({ id }: { id: string }) {
  return <CloseMenu key={usePathname()} id={id} />
}

function CloseMenu({ id }: { id: string }) {
  useEffect(() => {
    const menu = document.getElementById(id)
    if (menu === null || !('hidePopover' in menu)) return undefined
    menu.hidePopover()
    const closeOnLink = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null
      if (link === null) return
      if (link.hasAttribute('data-answers-tap') && !link.hasAttribute('aria-current')) return
      menu.hidePopover()
    }
    menu.addEventListener('click', closeOnLink)
    return () => menu.removeEventListener('click', closeOnLink)
  }, [id])
  return null
}
