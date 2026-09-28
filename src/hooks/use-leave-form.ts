'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { leaveTo, useUnsavedChanges } from './use-unsaved-changes'

// El guardia de un formulario y sus salidas elegidas —publicó, guardó, eligió irse desde un
// aviso—, que sueltan el guardia antes de navegar para no abrir otro aviso. Duro recarga la
// página entera: «Volver a abrirlo» tiene que traer lo publicado de nuevo.
export function useLeaveForm(dirty: boolean) {
  const router = useRouter()
  const [goTo, setGoTo] = useState<{ url: string; hard: boolean } | null>(null)
  // También mientras guarda: soltarlo a mitad retiraría la centinela y la volvería a poner.
  const guard = useUnsavedChanges(dirty && goTo === null)

  useEffect(() => {
    if (goTo === null) return
    if (goTo.hard) window.location.assign(goTo.url)
    else leaveTo(router, goTo.url)
  }, [goTo, router])

  function go(url: string, hard = false) {
    guard.release()
    setGoTo({ url, hard })
  }

  return { leavingTo: guard.leavingTo, leave: guard.leave, stay: guard.stay, go }
}
