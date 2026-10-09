// Covers: US2-AS4, US2-AS5, US2-AS6 y los Edge Cases «Texto solo con espacios» y «El teléfono o el
// correo en el texto»
import { describe, expect, it } from 'vitest'
import { feedbackSchema } from './feedback'
import { toFieldError } from './field-error'

const ATTEMPT = '6d1f5f0e-8a59-4f53-9a77-3c1c3e1a0b11'
const base = { attemptId: ATTEMPT, body: 'no entiendo el nivel', path: '/animales/luna' } as const

function errorsOf(input: unknown) {
  const result = feedbackSchema.safeParse(input)
  return (result.error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.'),
    ...toFieldError(issue),
  }))
}

describe('feedbackSchema acepta', () => {
  it('el texto sin los bordes, el intento y la ruta', () => {
    expect(feedbackSchema.parse({ ...base, body: '  me sirvió  ' })).toEqual({
      ...base,
      body: 'me sirvió',
    })
  })

  it('1.000 caracteres, contados como puntos de código', () => {
    const body = `${'🐾'.repeat(10)}${'a'.repeat(990)}`
    expect(feedbackSchema.parse({ ...base, body }).body).toBe(body)
  })

  it('un número que no es un teléfono, un enlace y un usuario de redes', () => {
    const body = 'Tengo 32 años, lo vi en instagram.com/luna y en @refugio, 500 caracteres'
    expect(feedbackSchema.parse({ ...base, body }).body).toBe(body)
  })
})

describe('feedbackSchema frena', () => {
  it.each(['', '   \n '])('vacía o solo espacios: que escriba algo', (body) => {
    expect(errorsOf({ ...base, body })).toEqual([{ path: 'body', key: 'feedback.errors.empty' }])
  })

  it('1.001 caracteres', () => {
    expect(errorsOf({ ...base, body: 'a'.repeat(1001) })).toEqual([
      { path: 'body', key: 'feedback.errors.too_long' },
    ])
  })

  it('más de 1.000 con un teléfono: solo el largo', () => {
    expect(errorsOf({ ...base, body: `099 123 456 ${'a'.repeat(1000)}` })).toEqual([
      { path: 'body', key: 'feedback.errors.too_long' },
    ])
  })

  it('un teléfono y un correo, citados', () => {
    expect(errorsOf({ ...base, body: 'llamame al 099 123 456' })).toEqual([
      { path: 'body', key: 'feedback.errors.contact', values: { fragment: '099 123 456' } },
    ])
    expect(errorsOf({ ...base, body: 'escribime a ana@example.test' })).toEqual([
      { path: 'body', key: 'feedback.errors.contact', values: { fragment: 'ana@example.test' } },
    ])
  })

  it('un intento o una ruta que no son: no se pudo', () => {
    expect(errorsOf({ ...base, attemptId: 'x' })).toEqual([
      { path: 'attemptId', key: 'feedback.errors.failed' },
    ])
    expect(errorsOf({ ...base, path: 3 })).toEqual([
      { path: 'path', key: 'feedback.errors.failed' },
    ])
  })

  it('sin texto: que escriba algo', () => {
    expect(errorsOf({ attemptId: ATTEMPT, path: '/' })).toEqual([
      { path: 'body', key: 'feedback.errors.empty' },
    ])
  })

  it('un campo de más', () => {
    expect(feedbackSchema.safeParse({ ...base, screen: 'pet' }).success).toBe(false)
  })
})
