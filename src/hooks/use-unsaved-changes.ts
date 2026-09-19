'use client'

import { useEffect } from 'react'

// El aviso antes de perder lo escrito (FR-023). El navegador muestra su propio texto: el que se
// le pase se ignora desde hace años, pero hay que devolver algo para que el diálogo aparezca.
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return undefined

    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
}
