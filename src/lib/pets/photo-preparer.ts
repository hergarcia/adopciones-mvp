import { canvasToWebp } from '@/lib/images/canvas-to-webp'
import { preparePhoto, type PhotoTools, type PreparedPhoto } from './photo-processing'
import type { PhotoJob, PhotoJobResult } from './photo-worker'

// La vista previa borrosa hace falta recién con la foto lista: baja con lo que la prepara.
export { thumbHashDataUrl } from '@/lib/images/thumbhash-data-url'

type Pending = { file: Blob; resolve: (prepared: PreparedPhoto) => void; reject: () => void }

let worker: Worker | null = null
let broken = false
let nextId = 0
const pending = new Map<number, Pending>()

const pageTools: PhotoTools<HTMLCanvasElement> = {
  canvas: (width, height) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  },
  webp: canvasToWebp,
}

// Un worker que no arrancó (el navegador no lo deja o la señal se cortó al pedirlo), o una foto que
// el worker no supo preparar: se prepara en la página.
function onThePage(job: Pending): void {
  preparePhoto(job.file, pageTools).then(job.resolve, job.reject)
}

function giveUp(): void {
  broken = true
  worker?.terminate()
  worker = null
  for (const job of pending.values()) onThePage(job)
  pending.clear()
}

function startWorker(): Worker {
  const started = new Worker(new URL('./photo-worker.ts', import.meta.url), { type: 'module' })
  started.addEventListener('message', (event: MessageEvent<PhotoJobResult>) => {
    const job = pending.get(event.data.id)
    if (job === undefined) return
    pending.delete(event.data.id)
    if (event.data.prepared !== null) {
      job.resolve(event.data.prepared)
      return
    }
    // Sin WebP en el worker no va a poder con ninguna foto: las que siguen van directo a la página.
    if (!event.data.exportsWebp) giveUp()
    onThePage(job)
  })
  started.addEventListener('error', giveUp)
  started.addEventListener('messageerror', giveUp)
  return started
}

const canUseWorker = () => typeof Worker === 'function' && typeof OffscreenCanvas === 'function'

// Los tres tamaños y el ThumbHash de una foto, fuera del hilo de la página: dibujar una de 12
// megapíxeles tres veces trababa los toques mientras se preparaba.
export function preparePhotoOffThePage(file: File): Promise<PreparedPhoto> {
  return new Promise((resolve, reject) => {
    const job: Pending = { file, resolve, reject }
    if (broken || !canUseWorker()) {
      onThePage(job)
      return
    }
    try {
      worker ??= startWorker()
    } catch {
      giveUp()
      onThePage(job)
      return
    }
    nextId += 1
    pending.set(nextId, job)
    worker.postMessage({ id: nextId, file } satisfies PhotoJob)
  })
}
