import { describe, expect, it } from 'vitest'
import { IDENTITY_PHOTO_TARGET_BYTES } from '@/lib/verification/rules'
import { hasWebpSignature, identityResolutionSchema, identitySubmissionSchema } from './identity'

const REQUEST_ID = '5b0f4c1e-2f55-4d59-9c1a-0d3c7a1e9b21'

function webp(size = 64): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.set([0x52, 0x49, 0x46, 0x46], 0)
  bytes.set([0x57, 0x45, 0x42, 0x50], 8)
  return bytes
}

const photo = (bytes: Uint8Array = webp(), type = 'image/webp') => ({ type, bytes })
const submission = (overrides: Record<string, unknown> = {}) => ({
  consent: 'yes',
  origin: 'profile',
  front: photo(),
  selfie: photo(),
  ...overrides,
})
const passes = (input: unknown) => identitySubmissionSchema.safeParse(input).success

// Covers: FR-008a. Si la firma no se mira, un JPEG con su EXIF y su GPS entra declarándose WebP.
describe('la firma de un WebP', () => {
  it('RIFF al principio y WEBP en el octavo byte', () => {
    expect(hasWebpSignature(webp())).toBe(true)
  })

  it.each([
    ['sin RIFF', [0, 1, 2, 3].map((i) => [i, 0x00] as const)],
    ['con la R cambiada', [[0, 0x53]] as const],
    ['con la última F cambiada', [[3, 0x47]] as const],
    ['sin WEBP', [[8, 0x41]] as const],
    ['con la última letra de WEBP cambiada', [[11, 0x51]] as const],
  ])('%s, no', (_, changes) => {
    const bytes = webp()
    for (const [index, value] of changes) bytes[index] = value
    expect(hasWebpSignature(bytes)).toBe(false)
  })

  it('un JPEG no', () => {
    expect(hasWebpSignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
      false,
    )
  })
})

// Covers: US1-AS2, US1-AS3, US1-AS9, FR-003, FR-005, FR-008, FR-008a
describe('el envío del pedido', () => {
  it('pasa con el consentimiento, el origen y dos WebP procesados', () => {
    expect(passes(submission())).toBe(true)
    expect(identitySubmissionSchema.parse(submission()).origin).toBe('profile')
  })

  it('sin el consentimiento, no', () => {
    expect(passes(submission({ consent: undefined }))).toBe(false)
    expect(passes(submission({ consent: 'no' }))).toBe(false)
  })

  it('con un origen desconocido, no', () => {
    expect(passes(submission({ origin: 'publicacion' }))).toBe(false)
  })

  it('con una sola foto, no', () => {
    expect(passes(submission({ selfie: undefined }))).toBe(false)
    expect(passes(submission({ front: undefined }))).toBe(false)
  })

  it('una foto que no es WebP, no', () => {
    expect(passes(submission({ front: photo(webp(), 'image/jpeg') }))).toBe(false)
  })

  it('hasta 450 KB exactos pasa; un byte más, no', () => {
    expect(passes(submission({ selfie: photo(webp(IDENTITY_PHOTO_TARGET_BYTES)) }))).toBe(true)
    expect(passes(submission({ selfie: photo(webp(IDENTITY_PHOTO_TARGET_BYTES + 1)) }))).toBe(false)
  })

  it('con tipo WebP y la firma de otro formato, no', () => {
    const jpeg = new Uint8Array(64)
    jpeg.set([0xff, 0xd8, 0xff, 0xe0], 0)
    expect(passes(submission({ front: photo(jpeg) }))).toBe(false)
  })

  it('bytes que no son bytes, no', () => {
    expect(passes(submission({ front: { type: 'image/webp', bytes: 'UklGRg==' } }))).toBe(false)
  })
})

// Covers: US2-AS2, FR-016. Rechazar sin motivo no puede existir, ni aprobar con uno.
describe('la resolución de un pedido', () => {
  const resolves = (input: unknown) => identityResolutionSchema.safeParse(input).success

  it('aprobar sin motivo pasa', () => {
    expect(identityResolutionSchema.parse({ requestId: REQUEST_ID, outcome: 'approve' })).toEqual({
      requestId: REQUEST_ID,
      outcome: 'approve',
    })
  })

  it('aprobar con motivo no', () => {
    expect(resolves({ requestId: REQUEST_ID, outcome: 'approve', reason: 'mismatch' })).toBe(false)
  })

  it.each(['unreadable', 'mismatch', 'expired_document', 'suspected_fraud'])(
    'rechazar con «%s» pasa',
    (reason) => {
      expect(resolves({ requestId: REQUEST_ID, outcome: 'reject', reason })).toBe(true)
    },
  )

  it('rechazar sin motivo, o con uno que no es de la lista, no', () => {
    expect(resolves({ requestId: REQUEST_ID, outcome: 'reject' })).toBe(false)
    expect(resolves({ requestId: REQUEST_ID, outcome: 'reject', reason: 'otro' })).toBe(false)
  })

  it('un resultado que no es aprobar ni rechazar no pasa', () => {
    expect(resolves({ requestId: REQUEST_ID, outcome: 'maybe' })).toBe(false)
  })

  it('un id que no es un uuid no pasa', () => {
    expect(resolves({ requestId: 'ana', outcome: 'approve' })).toBe(false)
    expect(resolves({ requestId: 'ana', outcome: 'reject', reason: 'mismatch' })).toBe(false)
  })
})
