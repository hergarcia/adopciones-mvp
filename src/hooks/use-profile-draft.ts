'use client'

import { useEffect, useState } from 'react'
import { PROFILE_DRAFT_KEY as KEY } from '@/lib/drafts/account-drafts'
import type { DraftValues } from '@/lib/profile/profile-draft'
import { afterOpen } from './after-open'
import { afterOpenModule } from './use-after-open'

// Lo escrito se recupera después de abrir, como el de un animal (historia #304): las reglas del
// borrador pesaban al abrir «Contá quién sos» (historia #326).
const loadDraftRules = afterOpenModule(() => import('@/lib/profile/profile-draft'))
type DraftRules = Awaited<ReturnType<typeof loadDraftRules>>

// Al llegar a «Mi perfil» con el alta terminada (al cerrar sesión o borrar la cuenta lo hace
// `clearAccountDrafts`): en un navegador compartido lo que alguien escribió y no guardó no puede
// quedar esperando a la próxima.
export function clearProfileDraft() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nada que hacer.
  }
}

function storedDraft(): { readable: true; raw: string | null } | { readable: false } {
  try {
    return { readable: true, raw: window.localStorage.getItem(KEY) }
  } catch {
    // Un navegador sin almacenamiento no puede romper el alta: se sigue con el formulario como lo
    // trajo la pantalla, que es lo mismo que desde otro dispositivo (FR-017).
    return { readable: false }
  }
}

// Un perfil incompleto no se guarda a medias: lo que la persona alcanzó a escribir y no envió vive
// en **este navegador**, y es de la cuenta que lo escribió (FR-016). Sin `owner` no hay borrador:
// editando un perfil ya guardado, lo que vale es lo guardado (FR-018).
export function useProfileDraft<T extends DraftValues>(initial: T, owner: string | undefined) {
  const [values, setValues] = useState(initial)
  // Lo que la pantalla le dice a la persona depende de esto: que lo escrito la espera acá es
  // cierto solo si el navegador deja guardarlo (FR-017). Son las reglas, una vez leído el borrador.
  const [rules, setRules] = useState<DraftRules | null>(null)
  const canKeepDraft = rules !== null

  // Después de montar y no en el inicializador: el servidor no tiene `localStorage`, así que
  // leerlo antes de hidratar hace que el primer render del cliente no coincida con el HTML que
  // vino y React descarte el subárbol.
  //
  // La regla desactivada pide usar un efecto solo para sincronizar con un sistema externo, y esto
  // es exactamente eso: el almacenamiento del navegador, que no existe hasta que hay navegador.
  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    if (owner === undefined) return undefined
    let isMounted = true
    afterOpen()
      .then(loadDraftRules)
      .then(
        (loaded) => {
          const stored = storedDraft()
          if (!isMounted || !stored.readable) return
          if (loaded.isForeignDraft(stored.raw, owner)) clearProfileDraft()
          setValues((current) => loaded.readDraft(stored.raw, owner, current).values)
          setRules(loaded)
        },
        // Sin las reglas, que no llegaron, es lo mismo que un navegador sin almacenamiento.
        () => {},
      )
    return () => {
      isMounted = false
    }
  }, [owner])
  /* eslint-enable react/set-state-in-effect */

  // Recién cuando el borrador se leyó: guardar antes lo pisaría con el formulario en blanco del
  // primer render, que es justo lo que se está tratando de no perder.
  //
  // Lo que la pantalla trajo y nadie tocó no es un borrador: guardarlo dejaría el nombre de Google
  // en el navegador antes de que la persona lo confirme (FR-030b), y un borrador vacío de otra
  // visita taparía después esa sugerencia.
  useEffect(() => {
    if (owner === undefined || rules === null) return
    try {
      if (JSON.stringify(values) === JSON.stringify(initial)) window.localStorage.removeItem(KEY)
      else window.localStorage.setItem(KEY, rules.serializeDraft(owner, values))
    } catch {
      // Sin almacenamiento el formulario sigue funcionando, solo no se acuerda.
    }
  }, [owner, rules, values, initial])

  return { values, setValues, clearDraft: clearProfileDraft, canKeepDraft }
}
