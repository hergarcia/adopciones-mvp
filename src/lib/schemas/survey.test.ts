// Covers: US1-AS2, US1-AS12, US1-AS13 y los Edge Cases «Texto solo con espacios», «Una respuesta
// libre de más de 500 caracteres» y «El teléfono o el correo en el texto»
import { describe, expect, it } from 'vitest'
import { toFieldError } from './field-error'
import { surveyAnswerSchema, surveyDismissSchema } from './survey'

const OFFER = '6d1f5f0e-8a59-4f53-9a77-3c1c3e1a0b11'
const base = { offerId: OFFER, moment: 'gave', option: 'yes', body: '' } as const

function errorsOf(input: unknown) {
  const result = surveyAnswerSchema.safeParse(input)
  return (result.error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.'),
    ...toFieldError(issue),
  }))
}

describe('surveyAnswerSchema acepta', () => {
  it('una opción del momento, sin escribir nada', () => {
    expect(surveyAnswerSchema.parse(base)).toEqual({ ...base, body: null })
  })

  it('solo espacios es sin texto, y el texto va sin los bordes', () => {
    expect(surveyAnswerSchema.parse({ ...base, body: '   ' }).body).toBeNull()
    expect(surveyAnswerSchema.parse({ ...base, body: '  me ahorró tiempo  ' }).body).toBe(
      'me ahorró tiempo',
    )
  })

  it('500 caracteres, contados como puntos de código', () => {
    const body = `${'🐾'.repeat(10)}${'a'.repeat(490)}`
    expect(surveyAnswerSchema.parse({ ...base, body }).body).toBe(body)
  })

  it('un número que no es un teléfono, un enlace y un usuario de redes', () => {
    const body = 'Lo vi en instagram.com/luna y en @refugio, 500 caracteres'
    expect(surveyAnswerSchema.parse({ ...base, body }).body).toBe(body)
  })

  it('las opciones de cada momento', () => {
    expect(
      surveyAnswerSchema.parse({ ...base, moment: 'adopted', option: 'somewhat' }).option,
    ).toBe('somewhat')
    expect(
      surveyAnswerSchema.parse({ ...base, moment: 'not_chosen', option: 'back_to_groups' }).option,
    ).toBe('back_to_groups')
  })
})

describe('surveyAnswerSchema frena', () => {
  it('sin opción: que elija una', () => {
    expect(errorsOf({ ...base, option: '' })).toEqual([
      { path: 'option', key: 'surveys.errors.option_required' },
    ])
  })

  it('una opción de otro momento', () => {
    expect(errorsOf({ ...base, option: 'somewhat' })).toEqual([
      { path: 'option', key: 'surveys.errors.option_required' },
    ])
  })

  it('501 caracteres', () => {
    expect(errorsOf({ ...base, body: 'a'.repeat(501) })).toEqual([
      { path: 'body', key: 'surveys.errors.too_long' },
    ])
  })

  it('un teléfono y un correo, citados', () => {
    expect(errorsOf({ ...base, body: 'llamame al 099 123 456' })).toEqual([
      { path: 'body', key: 'surveys.errors.contact', values: { fragment: '099 123 456' } },
    ])
    expect(errorsOf({ ...base, body: 'ana@gmail.com' })).toEqual([
      { path: 'body', key: 'surveys.errors.contact', values: { fragment: 'ana@gmail.com' } },
    ])
  })

  it('una oferta o un momento que no son', () => {
    expect(errorsOf({ ...base, offerId: 'x' })).toEqual([
      { path: 'offerId', key: 'surveys.errors.not_found' },
    ])
    expect(errorsOf({ ...base, moment: 'other' })).toEqual([
      { path: 'moment', key: 'surveys.errors.not_found' },
    ])
    expect(errorsOf({ ...base, body: 3 })).toEqual([{ path: 'body', key: 'surveys.errors.failed' }])
  })
})

describe('surveyDismissSchema', () => {
  it('la oferta y su momento', () => {
    expect(surveyDismissSchema.parse({ offerId: OFFER, moment: 'adopted' })).toEqual({
      offerId: OFFER,
      moment: 'adopted',
    })
  })

  it('una oferta o un momento que no son: la encuesta ya no está', () => {
    for (const input of [
      { offerId: 'x', moment: 'adopted' },
      { offerId: OFFER, moment: 'other' },
    ]) {
      expect(surveyDismissSchema.safeParse(input).error?.issues[0]?.message).toBe(
        'surveys.errors.not_found',
      )
    }
  })
})
