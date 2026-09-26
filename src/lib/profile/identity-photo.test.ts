import { describe, expect, it } from 'vitest'
import { IDENTITY_PHOTO_MAX_BYTES, IDENTITY_PHOTO_TARGET_BYTES } from '@/lib/verification/rules'
import { identityPhotoRejection, nextEncodeStep } from './identity-photo'

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
