import { crc32, deflateSync } from 'node:zlib'
import { thumbHashToRGBA } from 'thumbhash'

// `thumbHashToDataURL` escribe un PNG de 32 px sin comprimir: ~6 KB de base64 por foto, que el
// servidor manda dos veces (en el HTML y en el payload RSC) y que con cuatro animales en la portada
// la sacaban del presupuesto de LCP. La mancha no pierde nada a 8 px: el navegador la agranda suave.
const PLACEHOLDER_WIDTH = 8
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const RGBA_CHANNELS = 4

type Pixels = { w: number; h: number; rgba: Uint8Array }

function shrink({ w, h, rgba }: Pixels): Pixels {
  if (w <= PLACEHOLDER_WIDTH) return { w, h, rgba }
  const outW = PLACEHOLDER_WIDTH
  const outH = Math.max(1, Math.round((h * outW) / w))
  const out = new Uint8Array(outW * outH * RGBA_CHANNELS)
  for (let y = 0; y < outH; y++) {
    const y0 = Math.floor((y * h) / outH)
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * h) / outH))
    for (let x = 0; x < outW; x++) {
      const x0 = Math.floor((x * w) / outW)
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * w) / outW))
      const count = (y1 - y0) * (x1 - x0)
      for (let c = 0; c < RGBA_CHANNELS; c++) {
        let sum = 0
        for (let sy = y0; sy < y1; sy++) {
          for (let sx = x0; sx < x1; sx++) sum += rgba[(sy * w + sx) * RGBA_CHANNELS + c] ?? 0
        }
        out[(y * outW + x) * RGBA_CHANNELS + c] = Math.round(sum / count)
      }
    }
  }
  return { w: outW, h: outH, rgba: out }
}

function chunk(type: string, data: Buffer): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng({ w, h, rgba }: Pixels): Buffer {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(w, 0)
  header.writeUInt32BE(h, 4)
  // 8 bits por canal, RGBA, sin entrelazado.
  header.set([8, 6, 0, 0, 0], 8)
  const rowLength = w * RGBA_CHANNELS
  const rows = Buffer.alloc((rowLength + 1) * h)
  for (let y = 0; y < h; y++) {
    rows.set(rgba.subarray(y * rowLength, (y + 1) * rowLength), y * (rowLength + 1) + 1)
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** El ThumbHash guardado en base64, como data URL liviana para el fondo de una foto que carga. */
export function thumbHashPngDataUrl(thumbhash: string): string {
  const pixels = shrink(thumbHashToRGBA(Buffer.from(thumbhash, 'base64')))
  return `data:image/png;base64,${encodePng(pixels).toString('base64')}`
}
