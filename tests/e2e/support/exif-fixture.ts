import type { Page } from '@playwright/test'

// Una foto «de teléfono» para el flujo de publicar: un JPEG que dibuja el navegador, con el
// segmento EXIF que deja una cámara —marca, modelo y la ubicación— insertado a mano después del
// inicio del archivo. Se arma en cada corrida y no vive en el repo: son unos bytes que se sabe
// exactamente qué tienen, y eso es lo que la prueba necesita para buscarlos después (SC-003).
export const CAMERA_MAKE = 'CamaraDePrueba'
export const CAMERA_MODEL = 'ModeloSecreto'

function ascii(text: string): Buffer {
  return Buffer.from(`${text}\0`, 'latin1')
}

// Una entrada de IFD de 12 bytes: tag, tipo, cantidad y valor u offset (little endian).
function entry(tag: number, type: number, count: number, value: number): Buffer {
  const buffer = Buffer.alloc(12)
  buffer.writeUInt16LE(tag, 0)
  buffer.writeUInt16LE(type, 2)
  buffer.writeUInt32LE(count, 4)
  buffer.writeUInt32LE(value, 8)
  return buffer
}

function rationals(values: [number, number][]): Buffer {
  const buffer = Buffer.alloc(values.length * 8)
  values.forEach(([numerator, denominator], index) => {
    buffer.writeUInt32LE(numerator, index * 8)
    buffer.writeUInt32LE(denominator, index * 8 + 4)
  })
  return buffer
}

const ASCII = 2
const LONG = 4
const RATIONAL = 5

// El TIFF del EXIF: IFD0 con marca, modelo y el puntero al IFD del GPS, y el GPS con latitud y
// longitud de Montevideo. Los offsets cuentan desde el inicio del TIFF.
function exifSegment(): Buffer {
  const make = ascii(CAMERA_MAKE)
  const model = ascii(CAMERA_MODEL)
  const latitude = rationals([
    [34, 1],
    [54, 1],
    [1234, 100],
  ])
  const longitude = rationals([
    [56, 1],
    [9, 1],
    [5678, 100],
  ])

  const ifd0Size = 2 + 3 * 12 + 4
  const gpsSize = 2 + 4 * 12 + 4
  const makeAt = 8 + ifd0Size + gpsSize
  const modelAt = makeAt + make.length
  const latitudeAt = modelAt + model.length
  const longitudeAt = latitudeAt + latitude.length
  const gpsAt = 8 + ifd0Size

  const count = (n: number) => Buffer.from([n, 0])
  const next = Buffer.alloc(4)
  const tiff = Buffer.concat([
    Buffer.from('II*\0', 'latin1'),
    Buffer.from([8, 0, 0, 0]),
    count(3),
    entry(0x010f, ASCII, make.length, makeAt),
    entry(0x0110, ASCII, model.length, modelAt),
    entry(0x8825, LONG, 1, gpsAt),
    next,
    count(4),
    entry(0x0001, ASCII, 2, Buffer.from('S\0\0\0', 'latin1').readUInt32LE(0)),
    entry(0x0002, RATIONAL, 3, latitudeAt),
    entry(0x0003, ASCII, 2, Buffer.from('W\0\0\0', 'latin1').readUInt32LE(0)),
    entry(0x0004, RATIONAL, 3, longitudeAt),
    next,
    make,
    model,
    latitude,
    longitude,
  ])
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff])
  const header = Buffer.alloc(4)
  header.writeUInt16BE(0xffe1, 0)
  header.writeUInt16BE(payload.length + 2, 2)
  return Buffer.concat([header, payload])
}

/** Un JPEG de ese tamaño con marca, modelo y GPS en el EXIF. */
export async function photoWithGps(page: Page, width: number, height: number): Promise<Buffer> {
  const dataUrl = await page.evaluate(
    (size) => {
      const canvas = document.createElement('canvas')
      canvas.width = size.width
      canvas.height = size.height
      const context = canvas.getContext('2d')
      if (context === null) return ''
      const gradient = context.createLinearGradient(0, 0, size.width, size.height)
      gradient.addColorStop(0, '#8a6d3b')
      gradient.addColorStop(1, '#2e6b4e')
      context.fillStyle = gradient
      context.fillRect(0, 0, size.width, size.height)
      return canvas.toDataURL('image/jpeg', 0.9)
    },
    { width, height },
  )
  const jpeg = Buffer.from(dataUrl.split(',')[1] ?? '', 'base64')
  return Buffer.concat([jpeg.subarray(0, 2), exifSegment(), jpeg.subarray(2)])
}
