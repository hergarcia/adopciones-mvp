'use client'

import { useRef, useState } from 'react'
import { deleteLitter, previewLitterRemoval } from '@/actions/litters'
import { raceDeadline } from '@/lib/forms/action-deadline'
import type { LitterEditing, YoungFormValues } from '@/lib/litters/types'
import { withPetNotice } from '@/lib/pets/notice'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf } from './use-pet-status'

/** Lo que se confirma antes de guardar: solicitudes que se cierran, o la camada entera que se va. */
export type Removal = { kind: 'close'; count: number } | { kind: 'delete' }

type Blocked = { kind: 'session' } | { kind: 'level'; detail: { gatePath?: string } }

type Options = {
  /** La camada y sus crías publicadas al abrir la edición; sin ella, no hay nada que quitar. */
  editing?: Pick<LitterEditing, 'litterId' | 'youngIds'>
  go: (path: string) => void
  /** Sin sesión o sin nivel 1: el aviso del formulario. Sin respuesta al contar: el error de guardar. */
  onOutcome: (outcome: Blocked | { kind: 'offline' | 'site' }) => void
}

// Quitar crías al editar (FR-019, FR-020): en pantalla se quitan al momento, y al guardar se avisa
// antes lo que no se deshace. Si las quitadas tienen solicitudes abiertas, cuántas se cierran; si no
// quedó ninguna, que la camada se borra.
export function useYoungRemoval({ editing, go, onOutcome }: Options) {
  const litterId = editing?.litterId ?? ''
  const [removal, setRemoval] = useState<Removal | null>(null)
  const [checking, setChecking] = useState(false)
  const pendingSave = useRef<(() => void) | null>(null)

  async function beforeSave(young: YoungFormValues[], save: () => void) {
    if (young.length === 0) return setRemoval({ kind: 'delete' })
    const kept = new Set(young.flatMap((one) => (one.id === undefined ? [] : [one.id])))
    const removed = (editing?.youngIds ?? []).filter((id) => !kept.has(id))
    if (removed.length === 0) return save()
    setChecking(true)
    const preview = await previewLitterRemoval(litterId, removed).catch(() => null)
    setChecking(false)
    if (preview === null || !preview.ok) {
      return onOutcome({ kind: navigator.onLine ? 'site' : 'offline' })
    }
    if (preview.data.openApplications === 0) return save()
    pendingSave.current = save
    setRemoval({ kind: 'close', count: preview.data.openApplications })
  }

  // Borrar lleva a «Mis animales» con el aviso; una que ya no existe terminó igual. Devuelve por qué
  // no llegó, para el diálogo.
  async function deleteAll(): Promise<'offline' | 'no_response' | null> {
    const outcome = navigator.onLine
      ? await raceDeadline(deleteLitter(litterId), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    if (outcome.kind !== 'result') return failureOf(outcome.kind)
    const { result } = outcome
    if (result.ok) {
      go(withPetNotice('deleted'))
      return null
    }
    if (
      result.error === 'pets.errors.session' ||
      result.error === 'pets.errors.needs_verification'
    ) {
      setRemoval(null)
      onOutcome(
        result.error === 'pets.errors.session'
          ? { kind: 'session' }
          : { kind: 'level', detail: { gatePath: result.detail?.gatePath } },
      )
      return null
    }
    return 'no_response'
  }

  return {
    removal,
    checking,
    beforeSave,
    confirmClose: () => {
      setRemoval(null)
      pendingSave.current?.()
      pendingSave.current = null
    },
    deleteAll,
    cancel: () => {
      setRemoval(null)
      pendingSave.current = null
    },
  }
}
