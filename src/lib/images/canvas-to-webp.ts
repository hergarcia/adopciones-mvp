const WEBP = 'image/webp'

/** Lo que usa del canvas: un `HTMLCanvasElement` lo cumple. */
export type WebpSource = {
  width: number
  height: number
  toBlob: HTMLCanvasElement['toBlob']
  getContext(contextId: '2d'): Pick<CanvasRenderingContext2D, 'getImageData'> | null
}

// Safari no sabe exportar WebP desde un canvas: no falla, devuelve un PNG. Ahí el WebP lo hace
// libwebp compilado a WASM, que se baja solo en ese caso; en Chrome y Firefox no pesa nada. Sin
// esto, todo lo que sube un iPhone es un PNG que el servidor rechaza por no ser WebP.
export async function canvasToWebp(canvas: WebpSource, quality: number): Promise<Blob> {
  const native = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, WEBP, quality)
  })
  if (native?.type === WEBP) return native

  const context = canvas.getContext('2d')
  if (context === null) throw new Error('sin contexto 2d')
  const { default: encode } = await import('@jsquash/webp/encode')
  const bytes = await encode(context.getImageData(0, 0, canvas.width, canvas.height), {
    quality: Math.round(quality * 100),
  })
  return new Blob([bytes], { type: WEBP })
}
