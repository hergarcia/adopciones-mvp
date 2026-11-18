import { preparePhoto, type PhotoTools, type PreparedPhoto } from './photo-processing'

export type PhotoJob = { id: number; file: Blob }
export type PhotoJobResult = { id: number; prepared: PreparedPhoto | null }

const WEBP = 'image/webp'

// Solo el WebP del navegador: Safari exporta PNG, y esa foto vuelve a la página, que la pasa por
// libwebp (`canvasToWebp`). Así el worker no carga ese código.
const workerTools: PhotoTools<OffscreenCanvas> = {
  canvas: (width, height) => new OffscreenCanvas(width, height),
  webp: async (canvas, quality) => {
    const blob = await canvas.convertToBlob({ type: WEBP, quality })
    if (blob.type !== WEBP) throw new Error('el navegador no exporta WebP')
    return blob
  },
}

addEventListener('message', (event: MessageEvent<PhotoJob>) => {
  const { id, file } = event.data
  preparePhoto(file, workerTools).then(
    (prepared) => postMessage({ id, prepared } satisfies PhotoJobResult),
    () => postMessage({ id, prepared: null } satisfies PhotoJobResult),
  )
})
