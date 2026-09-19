'use client'

import { useEffect, useState } from 'react'

const KEY = 'profile-draft'

function readDraft<T>(initial: T, enabled: boolean): T {
  if (!enabled) return initial
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
  const [values, setValues] = useState(initial)
  const [restored, setRestored] = useState(!enabled)

  // Después de montar y no en el inicializador: el servidor no tiene `localStorage`, así que
  // leerlo antes de hidratar hace que el primer render del cliente no coincida con el HTML que
  // vino y React descarte el subárbol. El precio es un cuadro con el formulario como lo mandó el
  // servidor, que en esta pantalla está vacío.
  //
  // La regla desactivada pide usar un efecto solo para sincronizar con un sistema externo, y esto
  // es exactamente eso: el almacenamiento del navegador, que no existe hasta que hay navegador.
  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    if (!enabled) return
    setValues((current) => readDraft(current, true))
    setRestored(true)
  }, [enabled])
  /* eslint-enable react/set-state-in-effect */

  // Recién cuando el borrador se leyó: guardar antes lo pisaría con el formulario en blanco del
  // primer render, que es justo lo que se está tratando de no perder.
  useEffect(() => {
    if (!enabled || !restored) return
    try {
      window.localStorage.setItem(KEY, JSON.stringify(values))
    } catch {
      // Sin almacenamiento el formulario sigue funcionando, solo no se acuerda.
    }
  }, [enabled, restored, values])

  function clearDraft() {
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      // Nada que hacer.
    }
  }

  return { values, setValues, clearDraft }
}
