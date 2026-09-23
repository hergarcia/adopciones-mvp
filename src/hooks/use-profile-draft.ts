'use client'

import { useEffect, useState } from 'react'

const KEY = 'profile-draft'

// Al cerrar sesión o borrar la cuenta: el borrador no está atado a una persona, y en un navegador
// compartido lo que alguien escribió y no guardó le aparecería a la próxima cuenta.
export function clearProfileDraft() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nada que hacer.
  }
}

function readDraft<T>(initial: T, enabled: boolean): T {
  if (!enabled) return initial
  try {
    const saved = window.localStorage.getItem(KEY)
    if (!saved) return initial
    // Un campo vacío del borrador no pisa lo que trae la pantalla: quien empezó por correo y vuelve
    // por Google encontraría vacío el nombre que Google le sugiere.
    const written = Object.entries(JSON.parse(saved)).filter(([, value]) => value !== '')
    return { ...initial, ...Object.fromEntries(written) }
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
  // servidor: vacío, o con el nombre de Google.
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
  //
  // Lo que la pantalla trajo y nadie tocó no es un borrador: guardarlo dejaría el nombre de Google
  // en el navegador antes de que la persona lo confirme (FR-030b), y un borrador vacío de otra
  // visita taparía después esa sugerencia.
  useEffect(() => {
    if (!enabled || !restored) return
    try {
      if (JSON.stringify(values) === JSON.stringify(initial)) window.localStorage.removeItem(KEY)
      else window.localStorage.setItem(KEY, JSON.stringify(values))
    } catch {
      // Sin almacenamiento el formulario sigue funcionando, solo no se acuerda.
    }
  }, [enabled, restored, values, initial])

  return { values, setValues, clearDraft: clearProfileDraft }
}
