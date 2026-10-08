// Covers: US2-AS3, US2-AS7, FR-010 (de 1 a 3 fotos, el texto opcional de hasta 500 caracteres)
import { describe, expect, it } from 'vitest'
import { followUpAnswerSchema, followUpPhotoSchema } from './follow-up'

const APPLICATION = '0b9f3c1e-8f5a-4c2b-9d1e-2a3b4c5d6e7f'
const photo = (n: number) => `0b9f3c1e-8f5a-4c2b-9d1e-2a3b4c5d6e7${n}`

function firstIssue(input: unknown) {
  const issue = followUpAnswerSchema.safeParse(input).error?.issues[0]
  return issue === undefined ? null : { message: issue.message, path: issue.path }
}

describe('followUpAnswerSchema', () => {
  it('1 foto, sin texto: el texto es nulo', () => {
    expect(
      followUpAnswerSchema.parse({ applicationId: APPLICATION, photoIds: [photo(1)], text: '' }),
    ).toEqual({ applicationId: APPLICATION, photoIds: [photo(1)], text: null })
  })

  it('solo espacios es sin texto; el texto se recorta', () => {
    const base = { applicationId: APPLICATION, photoIds: [photo(1)] }
    expect(followUpAnswerSchema.parse({ ...base, text: '   ' }).text).toBeNull()
    expect(followUpAnswerSchema.parse({ ...base, text: '  Duerme.  ' }).text).toBe('Duerme.')
  })

  it('3 fotos en orden y 500 caracteres: pasa', () => {
    const ids = [photo(3), photo(1), photo(2)]
    const text = '🐶'.repeat(500)
    expect(followUpAnswerSchema.parse({ applicationId: APPLICATION, photoIds: ids, text })).toEqual(
      { applicationId: APPLICATION, photoIds: ids, text },
    )
  })

  it('sin fotos: hace falta al menos una', () => {
    expect(firstIssue({ applicationId: APPLICATION, photoIds: [], text: 'Hola' })).toEqual({
      message: 'follow_ups.errors.photos_required',
      path: ['photoIds'],
    })
  })

  it('4 fotos: inválido', () => {
    const ids = [1, 2, 3, 4].map(photo)
    expect(firstIssue({ applicationId: APPLICATION, photoIds: ids, text: '' })).toEqual({
      message: 'follow_ups.errors.invalid',
      path: ['photoIds'],
    })
  })

  it('501 caracteres: el texto es largo', () => {
    expect(
      firstIssue({ applicationId: APPLICATION, photoIds: [photo(1)], text: '🐶'.repeat(501) }),
    ).toEqual({ message: 'follow_ups.errors.text_too_long', path: ['text'] })
  })

  it('ids que no son uuid, o un campo de más', () => {
    expect(firstIssue({ applicationId: 'x', photoIds: [photo(1)], text: '' })).toEqual({
      message: 'follow_ups.errors.not_found',
      path: ['applicationId'],
    })
    expect(firstIssue({ applicationId: APPLICATION, photoIds: ['x'], text: '' })).toEqual({
      message: 'follow_ups.errors.invalid',
      path: ['photoIds', 0],
    })
    expect(firstIssue({ applicationId: APPLICATION, photoIds: [photo(1)], text: 3 })).toEqual({
      message: 'follow_ups.errors.invalid',
      path: ['text'],
    })
    expect(
      followUpAnswerSchema.safeParse({
        applicationId: APPLICATION,
        photoIds: [photo(1)],
        text: '',
        extra: 1,
      }).success,
    ).toBe(false)
  })
})

describe('followUpPhotoSchema', () => {
  const valid = {
    applicationId: APPLICATION,
    photoId: photo(1),
    width: '1200',
    height: '1500',
    thumbhash: 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw==',
  }

  it('los lados llegan como texto del formulario', () => {
    expect(followUpPhotoSchema.parse(valid)).toEqual({ ...valid, width: 1200, height: 1500 })
  })

  it.each([
    ['photoId', 'x'],
    ['width', '0'],
    ['width', '1.5'],
    ['height', '32768'],
    ['height', 'abc'],
    ['thumbhash', 'no es base64!'],
    ['thumbhash', ''],
  ])('%s = %s: la foto no sirve', (field, value) => {
    const issue = followUpPhotoSchema.safeParse({ ...valid, [field]: value }).error?.issues[0]
    expect(issue?.message).toBe('follow_ups.errors.photo_invalid')
  })

  it('32767 y 1 son lados válidos', () => {
    expect(followUpPhotoSchema.safeParse({ ...valid, width: '1', height: '32767' }).success).toBe(
      true,
    )
  })

  it('una solicitud que no es uuid: no existe', () => {
    expect(
      followUpPhotoSchema.safeParse({ ...valid, applicationId: 'x' }).error?.issues[0]?.message,
    ).toBe('follow_ups.errors.not_found')
  })
})
