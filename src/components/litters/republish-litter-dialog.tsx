'use client'

import { laterDialog } from '@/components/forms/later-dialog'
import type { LaterPart } from '@/components/ui/deferred-part'

export type RepublishLitterTexts = {
  title: string
  /** «Elegí al menos una»: también por qué el botón está apagado. */
  help: string
  confirm: string
  cancel: string
  close: string
  /** Cada cría adoptada: a quién se dio y, si fue a una persona, que esa adopción termina (#67). */
  young: { id: string; name: string; detail: string | null; ends: string | null }[]
  /** La espera de la lista de crías, y el aviso si no llega. */
  part: LaterPart
}

// Volver a publicar una camada adoptada (FR-006). «Volver a publicar» y el título salen con la
// pantalla; las crías llegan después (historia #316). Las que no se eligen siguen adoptadas. Cancelar
// no cambia nada; `onConfirm` corre «Volver a publicar» con las crías elegidas, en el flujo de
// siempre, que dice lo que no llegó (research R11).
export const RepublishLitterDialog = laterDialog<{
  texts: RepublishLitterTexts
  onConfirm: (youngIds: string[]) => void
}>(() => import('./republish-litter-body').then((module) => module.RepublishLitterBody))
