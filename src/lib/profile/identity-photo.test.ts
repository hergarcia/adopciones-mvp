import { describe, expect, it } from 'vitest'
import { IDENTITY_PHOTO_MAX_BYTES, IDENTITY_PHOTO_TARGET_BYTES } from '@/lib/verification/rules'
import { identityPhotoRejection, nextEncodeStep, processedPhotoType } from './identity-photo'

const OVER = IDENTITY_PHOTO_TARGET_BYTES + 1

// Covers: US1-AS7, FR-006
describe('qué foto se acepta', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])('%s sí', (type) => {
    expect(identityPhotoRejection({ type, size: 1000 })).toBeNull()
  })

  it('otra cosa dice qué se acepta', () => {
    expect(identityPhotoRejection({ type: 'image/heic', size: 1000 })).toBe(
      'identity.errors.photo_type',
    )
    expect(identityPhotoRejection({ type: 'application/pdf', size: 1000 })).toBe(
      'identity.errors.photo_type',
    )
  })

  it('hasta 10 MB exactos sí; un byte más, no', () => {
    expect(
      identityPhotoRejection({ type: 'image/jpeg', size: IDENTITY_PHOTO_MAX_BYTES }),
    ).toBeNull()
    expect(identityPhotoRejection({ type: 'image/jpeg', size: IDENTITY_PHOTO_MAX_BYTES + 1 })).toBe(
      'identity.errors.photo_too_big',
    )
  })
})

// Covers: FR-008, plan §3. Si el tamaño se calcula mal, el envío pasa el límite y la persona no
// puede mandar el pedido.
describe('el procesado de una foto de identidad', () => {
  it('la primera salida limita el lado mayor a 1600, vertical u horizontal', () => {
    expect(nextEncodeStep(4000, 3000, null, -1)).toEqual({
      kind: 'encode',
      step: 0,
      width: 1600,
      height: 1200,
      quality: 0.85,
    })
    expect(nextEncodeStep(3000, 4000, null, -1)).toMatchObject({ width: 1200, height: 1600 })
  })

  it('no agranda una foto chica', () => {
    expect(nextEncodeStep(800, 600, null, -1)).toMatchObject({ width: 800, height: 600 })
  })

  it('redondea el lado menor', () => {
    expect(nextEncodeStep(3001, 2000, null, -1)).toMatchObject({ width: 1600, height: 1066 })
  })

  it('si entra en el objetivo, termina', () => {
    expect(nextEncodeStep(4000, 3000, IDENTITY_PHOTO_TARGET_BYTES, 0)).toEqual({ kind: 'done' })
    expect(nextEncodeStep(4000, 3000, 1000, 2)).toEqual({ kind: 'done' })
  })

  it('pasado el objetivo baja la calidad a 0,75 y después a 0,65, al mismo lado', () => {
    expect(nextEncodeStep(4000, 3000, OVER, 0)).toEqual({
      kind: 'encode',
      step: 1,
      width: 1600,
      height: 1200,
      quality: 0.75,
    })
    expect(nextEncodeStep(4000, 3000, OVER, 1)).toMatchObject({
      step: 2,
      width: 1600,
      quality: 0.65,
    })
  })

  it('después baja el lado a 1280', () => {
    expect(nextEncodeStep(4000, 3000, OVER, 2)).toEqual({
      kind: 'encode',
      step: 3,
      width: 1280,
      height: 960,
      quality: 0.65,
    })
  })

  it('si ni así entra, se rinde', () => {
    expect(nextEncodeStep(4000, 3000, OVER, 3)).toEqual({ kind: 'give_up' })
  })
})

function webp(size = 64): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.set([0x52, 0x49, 0x46, 0x46], 0)
  bytes.set([0x57, 0x45, 0x42, 0x50], 8)
  return bytes
}

function jpeg(size = 64): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.set([0xff, 0xd8, 0xff, 0xe0], 0)
  return bytes
}

// Covers: FR-008a. Si la firma no se mira, un PNG con sus metadatos entra declarándose WebP o JPEG.
describe('el formato de una foto, por sus bytes', () => {
  it('RIFF al principio y WEBP en el octavo byte es WebP', () => {
    expect(processedPhotoType(webp())).toBe('image/webp')
  })

  it('FF D8 FF al principio es JPEG', () => {
    expect(processedPhotoType(jpeg())).toBe('image/jpeg')
  })

  it.each([
    ['sin RIFF', [0, 1, 2, 3].map((i) => [i, 0x00] as const)],
    ['con la R cambiada', [[0, 0x53]] as const],
    ['con la última F cambiada', [[3, 0x47]] as const],
    ['sin WEBP', [[8, 0x41]] as const],
    ['con la última letra de WEBP cambiada', [[11, 0x51]] as const],
  ])('un WebP %s, nada', (_, changes) => {
    const bytes = webp()
    for (const [index, value] of changes) bytes[index] = value
    expect(processedPhotoType(bytes)).toBeNull()
  })

  it.each([
    ['con el primer byte cambiado', 0, 0xfe],
    ['con el segundo byte cambiado', 1, 0xd9],
    ['con el tercer byte cambiado', 2, 0x00],
  ])('un JPEG %s, nada', (_, index, value) => {
    const bytes = jpeg()
    bytes[index] = value
    expect(processedPhotoType(bytes)).toBeNull()
  })

  it('un PNG, nada', () => {
    expect(
      processedPhotoType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBeNull()
  })
})
