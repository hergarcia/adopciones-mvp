import type { ActionResult } from '@/actions/result'
import { photoIdsToSend, photosToUpload, shouldRenewIds, type PhotoList } from './photo-list'
import type { PreparedPhoto } from './photo-processing'
import { SAVE_TIMEOUT_MS } from './rules'
import { classifySaveOutcome, type SaveFailure } from './save-failure'

export type SaveProgress =
  { phase: 'uploading'; done: number; total: number } | { phase: 'sending' }
export type SaveOutcome<D> = { kind: 'ok' } | { kind: SaveFailure; detail?: D }

type Result<D> = ActionResult<unknown, D>

type Run<D> = {
  photos: {
    latest: () => PhotoList<PreparedPhoto>
    markUploaded: (key: string) => void
    renewIds: () => void
  }
  returnTo: string
  send: (photoIds: string[]) => Promise<Result<D>>
  upload: (form: FormData) => Promise<Result<D>>
  onProgress: (progress: SaveProgress) => void
}

async function call<D>(action: () => Promise<Result<D>>): Promise<SaveOutcome<D>> {
  try {
    const result = await action()
    const kind = classifySaveOutcome({
      rejected: false,
      online: navigator.onLine,
      timedOut: false,
      result,
    })
    return kind === 'ok' ? { kind } : { kind, detail: result.ok ? undefined : result.detail }
  } catch {
    return {
      kind: classifySaveOutcome({ rejected: true, online: navigator.onLine, timedOut: false }),
    }
  }
}

function uploadForm(
  slot: { photoId: string; prepared: PreparedPhoto },
  returnTo: string,
): FormData {
  const form = new FormData()
  form.set('photoId', slot.photoId)
  form.set('width', String(slot.prepared.width))
  form.set('height', String(slot.prepared.height))
  form.set('thumbhash', slot.prepared.thumbhash)
  form.set('returnTo', returnTo)
  for (const [size, file] of Object.entries(slot.prepared.files)) form.set(size, file)
  return form
}

async function attempt<D>(run: Run<D>, renew: boolean): Promise<SaveOutcome<D>> {
  const { photos, returnTo, send, upload, onProgress } = run
  const pending = photosToUpload(photos.latest())
  for (const [index, slot] of pending.entries()) {
    onProgress({ phase: 'uploading', done: index, total: pending.length })
    // De a una y en orden: el progreso cuenta respuestas, y un reintento sube solo lo que falta.
    // oxlint-disable-next-line no-await-in-loop
    const uploaded = await call(() => upload(uploadForm(slot, returnTo)))
    if (uploaded.kind !== 'ok') return uploaded
    photos.markUploaded(slot.key)
  }
  onProgress({ phase: 'sending' })
  const sent = await call(() => send(photoIdsToSend(photos.latest())))
  if (renew && shouldRenewIds(sent.kind, photos.latest())) {
    photos.renewIds()
    return attempt(run, false)
  }
  return sent
}

// Publicar o guardar de punta a punta: sube las fotos que falten, de a una y contando, y después
// manda el formulario con los ids en orden. Si la base ya no acepta alguna foto en espera, las
// vuelve a subir con ids nuevos y reintenta una sola vez (research R1, `shouldRenewIds`). Pasados 2
// minutos deja de esperar y lo trata como que el sitio no respondió (FR-018); la regla vive en
// `save-failure.ts`. Llega después de abrir, con `usePetSave` (historia #304).
export async function runPetSave<D>(run: Run<D>): Promise<SaveOutcome<D>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<SaveOutcome<D>>((resolve) => {
    timer = setTimeout(() => {
      resolve({
        kind: classifySaveOutcome({ rejected: false, online: navigator.onLine, timedOut: true }),
      })
    }, SAVE_TIMEOUT_MS)
  })
  try {
    return await Promise.race([attempt(run, true), timeout])
  } finally {
    clearTimeout(timer)
  }
}
