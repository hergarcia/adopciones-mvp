'use client'

import { useEffect, useState } from 'react'

const KEY = 'profile-draft'

function readDraft<T>(initial: T, enabled: boolean): T {
  if (!enabled || typeof window === 'undefined') return initial
  try {
    const saved = window.localStorage.getItem(KEY)
    return saved ? { ...initial, ...JSON.parse(saved) } : initial
  } catch {
    // Un borrador roto o un navegador sin almacenamiento no puede romper el alta: se sigue con el
    // formulario en blanco, que es lo mismo que desde otro dispositivo.
    return initial
  }
}

// Un perfil incompleto no se guarda a medias: lo que queda registrado es que la cuenta existe y
// que su perfil está sin terminar. Lo que la persona alcanzó a escribir y no envió vive en **este
// navegador**, para que al volver no tenga que reescribirlo; desde otro dispositivo el formulario
// arranca vacío (FR-021).
export function useProfileDraft<T extends Record<string, unknown>>(initial: T, enabled: boolean) {
  // En el inicializador y no en un efecto: leer el borrador no es sincronizar con un sistema
  // externo, es el valor inicial, y hacerlo en un efecto provoca un segundo render con el
  // formulario vacío a la vista.
  const [values, setValues] = useState(() => readDraft(initial, enabled))

  useEffect(() => {
    if (!enabled) return
    try {
      window.localStorage.setItem(KEY, JSON.stringify(values))
    } catch {
      // Sin almacenamiento el formulario sigue funcionando, solo no se acuerda.
    }
  }, [enabled, values])

  function clearDraft() {
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      // Nada que hacer.
    }
  }

  return { values, setValues, clearDraft }
}
