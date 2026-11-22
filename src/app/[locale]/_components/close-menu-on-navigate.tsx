'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// La cabecera sigue montada al navegar, así que el menú de la cuenta se cierra solo: al tocar uno de
// sus enlaces, también si lleva a la misma pantalla o solo cambia la consulta, y al cambiar de
// pantalla con atrás y adelante (con la pantalla como `key`, se vuelve a montar y lo cierra).
export function CloseMenuOnNavigate({ id }: { id: string }) {
  return <CloseMenu key={usePathname()} id={id} />
}

function CloseMenu({ id }: { id: string }) {
  useEffect(() => {
    const menu = document.getElementById(id)
    if (menu === null || !('hidePopover' in menu)) return undefined
    menu.hidePopover()
    const closeOnLink = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a') !== null) menu.hidePopover()
    }
    menu.addEventListener('click', closeOnLink)
    return () => menu.removeEventListener('click', closeOnLink)
  }, [id])
  return null
}
