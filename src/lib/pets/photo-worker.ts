import { preparePhoto, type PhotoTools, type PreparedPhoto } from './photo-processing'

export type PhotoJob = { id: number; file: Blob }
export type PhotoJobResult = { id: number; prepared: PreparedPhoto | null; exportsWebp: boolean }

const WEBP = 'image/webp'

// Solo el WebP del navegador: Safari exporta PNG, y esa foto vuelve a la página, que la pasa por
// libwebp (`canvasToWebp`). Así el worker no carga ese código. Se prueba una vez con un canvas de un
// píxel, para no decodificar y dibujar una foto de 12 megapíxeles que después se tira. Chromium no
// exporta un canvas sin contexto: por eso el `getContext`.
async function probeWebp(): Promise<boolean> {
  const probe = new OffscreenCanvas(1, 1)
  probe.getContext('2d')
  const blob = await probe.convertToBlob({ type: WEBP })
  return blob.type === WEBP
}

const exportsWebp = probeWebp().catch(() => false)

const workerTools: PhotoTools<OffscreenCanvas> = {
  canvas: (width, height) => new OffscreenCanvas(width, height),
  webp: async (canvas, quality) => {
    const blob = await canvas.convertToBlob({ type: WEBP, quality })
    if (blob.type !== WEBP) throw new Error('el navegador no exporta WebP')
    return blob
  },
}

async function prepare(file: Blob): Promise<Omit<PhotoJobResult, 'id'>> {
  if (!(await exportsWebp)) return { prepared: null, exportsWebp: false }
  try {
    return { prepared: await preparePhoto(file, workerTools), exportsWebp: true }
  } catch {
    return { prepared: null, exportsWebp: true }
  }
}

addEventListener('message', (event: MessageEvent<PhotoJob>) => {
  const { id, file } = event.data
  void prepare(file).then((result) => postMessage({ id, ...result } satisfies PhotoJobResult))
})
