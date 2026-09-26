'use client'

import { useEffect, useState } from 'react'
import {
  type DraftValues,
  isForeignDraft,
  readDraft,
  serializeDraft,
} from '@/lib/profile/profile-draft'

const KEY = 'profile-draft'

// Al cerrar sesión, al borrar la cuenta y al llegar a «Mi perfil» con el alta terminada: en un
// navegador compartido lo que alguien escribió y no guardó no puede quedar esperando a la próxima.
export function clearProfileDraft() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nada que hacer.
  }
}

function storedDraft(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    // Un navegador sin almacenamiento no puede romper el alta: se sigue con el formulario como lo
    // trajo la pantalla, que es lo mismo que desde otro dispositivo (FR-017).
    return null
  }
}

// Un perfil incompleto no se guarda a medias: lo que la persona alcanzó a escribir y no envió vive
// en **este navegador**, y es de la cuenta que lo escribió (FR-016). Sin `owner` no hay borrador:
// editando un perfil ya guardado, lo que vale es lo guardado (FR-018).
export function useProfileDraft<T extends DraftValues>(initial: T, owner: string | undefined) {
  const [values, setValues] = useState(initial)
  const [restored, setRestored] = useState(owner === undefined)

  // Después de montar y no en el inicializador: el servidor no tiene `localStorage`, así que
  // leerlo antes de hidratar hace que el primer render del cliente no coincida con el HTML que
  // vino y React descarte el subárbol.
  //
  // La regla desactivada pide usar un efecto solo para sincronizar con un sistema externo, y esto
  // es exactamente eso: el almacenamiento del navegador, que no existe hasta que hay navegador.
  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    if (owner === undefined) return
    const raw = storedDraft()
    if (isForeignDraft(raw, owner)) clearProfileDraft()
    setValues((current) => readDraft(raw, owner, current).values)
    setRestored(true)
  }, [owner])
  /* eslint-enable react/set-state-in-effect */

  // Recién cuando el borrador se leyó: guardar antes lo pisaría con el formulario en blanco del
  // primer render, que es justo lo que se está tratando de no perder.
  //
  // Lo que la pantalla trajo y nadie tocó no es un borrador: guardarlo dejaría el nombre de Google
  // en el navegador antes de que la persona lo confirme (FR-030b), y un borrador vacío de otra
  // visita taparía después esa sugerencia.
  useEffect(() => {
    if (owner === undefined || !restored) return
    try {
      if (JSON.stringify(values) === JSON.stringify(initial)) window.localStorage.removeItem(KEY)
      else window.localStorage.setItem(KEY, serializeDraft(owner, values))
    } catch {
      // Sin almacenamiento el formulario sigue funcionando, solo no se acuerda.
    }
  }, [owner, restored, values, initial])

  return { values, setValues, clearDraft: clearProfileDraft }
}
