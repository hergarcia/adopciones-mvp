import { photoFileProblem } from '@/lib/images/photo-file'
import { MAX_PHOTOS } from './rules'

export type PhotoPreview = {
  src: string
  srcSet?: string
  placeholder: string | null
  width: number
  height: number
}

/** Una foto en pantalla, en el orden en que se va a publicar. `P` es lo que se preparó para subir. */
export type PhotoSlot<P> =
  | { key: string; state: 'preparing' }
  | { key: string; state: 'ready'; photoId: string; preview: PhotoPreview; prepared: P }
  | { key: string; state: 'uploaded'; photoId: string; preview: PhotoPreview; prepared: P | null }

/** Una foto que no entró: no ocupa lugar, y su motivo va debajo de la grilla. */
export type PhotoRejection = { key: string; fileName: string; error: string }

export type PhotoList<P> = {
  slots: PhotoSlot<P>[]
  rejections: PhotoRejection[]
  /** Cuántas de la última elección quedaron afuera por el máximo de 5. */
  overflow: number
}

export function emptyPhotoList<P>(slots: PhotoSlot<P>[] = []): PhotoList<P> {
  return { slots, rejections: [], overflow: 0 }
}

export function acceptPhotoFile(file: { type: string; size: number }): string | null {
  const problem = photoFileProblem(file)
  if (problem === null) return null
  return problem === 'type' ? 'pets.errors.photo_type' : 'pets.errors.photo_too_big'
}

type Picked = { key: string; file: { name: string; type: string; size: number } }

// Entran en el orden en que llegaron hasta completar 5; las rechazadas no ocupan lugar, y de las
// que sobran se dice cuántas (FR-007, Edge Cases). Una elección nueva reemplaza los motivos de la
// anterior.
export function addPhotos<P>(list: PhotoList<P>, picked: Picked[]): PhotoList<P> {
  const slots = [...list.slots]
  const rejections: PhotoRejection[] = []
  let overflow = 0
  for (const { key, file } of picked) {
    const error = acceptPhotoFile(file)
    if (error !== null) rejections.push({ key, fileName: file.name, error })
    else if (slots.length < MAX_PHOTOS) slots.push({ key, state: 'preparing' })
    else overflow += 1
  }
  return { slots, rejections, overflow }
}

export function markReady<P>(
  list: PhotoList<P>,
  key: string,
  ready: { photoId: string; preview: PhotoPreview; prepared: P },
): PhotoList<P> {
  return {
    ...list,
    slots: list.slots.map((slot) => (slot.key === key ? { key, state: 'ready', ...ready } : slot)),
  }
}

// La que no se pudo preparar sale de la grilla y dice su motivo; las otras quedan.
export function rejectPhoto<P>(
  list: PhotoList<P>,
  key: string,
  fileName: string,
  error: string,
): PhotoList<P> {
  return {
    ...list,
    slots: list.slots.filter((slot) => slot.key !== key),
    rejections: [...list.rejections, { key, fileName, error }],
  }
}

export function markUploaded<P>(list: PhotoList<P>, key: string): PhotoList<P> {
  return {
    ...list,
    slots: list.slots.map((slot) =>
      slot.key === key && slot.state === 'ready' ? { ...slot, state: 'uploaded' } : slot,
    ),
  }
}

// Sacar la portada hace portada a la siguiente: es la que queda primera (FR-006).
export function removePhoto<P>(list: PhotoList<P>, key: string): PhotoList<P> {
  return { ...list, slots: list.slots.filter((slot) => slot.key !== key) }
}

export function movePhoto<P>(list: PhotoList<P>, key: string, step: -1 | 1): PhotoList<P> {
  const from = list.slots.findIndex((slot) => slot.key === key)
  const to = from + step
  if (from < 0 || to < 0 || to >= list.slots.length) return list
  const slots = [...list.slots]
  ;[slots[from], slots[to]] = [slots[to], slots[from]]
  return { ...list, slots }
}

// Pasa a ser la primera y las demás corren un lugar sin cambiar su orden (FR-006).
export function makeCover<P>(list: PhotoList<P>, key: string): PhotoList<P> {
  const cover = list.slots.find((slot) => slot.key === key)
  if (cover === undefined) return list
  return { ...list, slots: [cover, ...list.slots.filter((slot) => slot.key !== key)] }
}

/** Los ids que se mandan al publicar o guardar, en orden. */
export function photoIdsToSend<P>(list: PhotoList<P>): string[] {
  return list.slots.flatMap((slot) => (slot.state === 'preparing' ? [] : [slot.photoId]))
}

/** Las que todavía no subieron: un reintento vuelve a mandar solo estas. */
export function photosToUpload<P>(list: PhotoList<P>) {
  return list.slots.filter((slot) => slot.state === 'ready')
}

// Cuando la base ya no acepta las fotos en espera (se purgaron o se soltaron en otra pestaña), las
// preparadas vuelven a subir con ids nuevos, sin que la persona haga nada (research R1).
export function withNewIds<P>(list: PhotoList<P>, newId: () => string): PhotoList<P> {
  return {
    ...list,
    slots: list.slots.map((slot) =>
      slot.state === 'uploaded' && slot.prepared !== null
        ? { ...slot, state: 'ready', prepared: slot.prepared, photoId: newId() }
        : slot,
    ),
  }
}

// Al editar, una foto en espera que la base ya purgó (pasadas las 24 horas) falta igual que una que
// otra pestaña sacó del animal, y la base contesta «cambió en otra pestaña» sin poder distinguirlas.
// Con fotos subidas desde esta pantalla vale un reintento con ids nuevos: si faltaba una de las ya
// publicadas, el reintento vuelve a decir lo mismo y eso es lo que se muestra.
export function shouldRenewIds<P>(failure: string, list: PhotoList<P>): boolean {
  if (failure === 'photos_invalid') return true
  return (
    failure === 'changed_elsewhere' &&
    list.slots.some((slot) => slot.state === 'uploaded' && slot.prepared !== null)
  )
}

export type Readiness = 'wait' | 'blocked' | 'empty' | 'ready'

// Publicar espera a las fotos que se están preparando y nunca manda sin una que se ve en pantalla.
// `waitedFor` son las que se estaban preparando al tocar la acción: si alguna terminó rechazada, no
// se manda nada y la persona decide (spec, Edge Cases; research R19).
export function submitReadiness<P>(list: PhotoList<P>, waitedFor: readonly string[]): Readiness {
  if (list.slots.some((slot) => slot.state === 'preparing')) return 'wait'
  if (list.rejections.some((rejection) => waitedFor.includes(rejection.key))) return 'blocked'
  if (list.slots.length === 0) return 'empty'
  return 'ready'
}

export function preparingKeys<P>(list: PhotoList<P>): string[] {
  return list.slots.flatMap((slot) => (slot.state === 'preparing' ? [slot.key] : []))
}
