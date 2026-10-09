// Covers: FR-020, FR-024, US2-AS2, US2-AS3 (lo que llega a rechazar y a dejar sin efecto); FR-030,
// FR-034, US3-AS4, US3-AS5 (lo que llega a preguntar y a contestar)
import { describe, expect, it } from 'vitest'
import { QUESTION_MAX_LENGTH, REJECTION_NOTE_MAX_LENGTH } from '@/lib/applications/rules'
import { toFieldError } from './field-error'
import {
  answerSchema,
  questionSchema,
  rejectionSchema,
  revocationSchema,
} from './application-response'

const ID = '7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a'
const other = { id: ID, reason: 'other' }

function errorsOf(
  schema:
    typeof rejectionSchema | typeof revocationSchema | typeof questionSchema | typeof answerSchema,
  input: unknown,
) {
  const parsed = schema.safeParse(input)
  return parsed.success ? [] : parsed.error.issues.map((issue) => [issue.path, toFieldError(issue)])
}

describe('rejectionSchema', () => {
  it('un motivo de la lista, sin línea', () => {
    expect(rejectionSchema.safeParse({ id: ID, reason: 'alone_too_long' })).toEqual({
      success: true,
      data: { id: ID, reason: 'alone_too_long', note: null },
    })
  })

  it('descarta la línea que viene con un motivo que no es «otro»', () => {
    expect(rejectionSchema.safeParse({ id: ID, reason: 'housing', note: 'Es chico' }).data).toEqual(
      { id: ID, reason: 'housing', note: null },
    )
  })

  it('«otro» guarda la línea sin los espacios de los bordes', () => {
    expect(rejectionSchema.safeParse({ ...other, note: '  Se mudó  ' }).data).toEqual({
      ...other,
      note: 'Se mudó',
    })
  })

  it('«otro» sin línea, o con solo espacios, pide escribirla', () => {
    const missing = [[['note'], { key: 'inbox.errors.missing_note' }]]
    expect(errorsOf(rejectionSchema, other)).toEqual(missing)
    expect(errorsOf(rejectionSchema, { ...other, note: '   ' })).toEqual(missing)
  })

  it('«otro» acepta 200 caracteres y no 201; un emoji cuenta uno', () => {
    expect(
      errorsOf(rejectionSchema, { ...other, note: 'a'.repeat(REJECTION_NOTE_MAX_LENGTH) }),
    ).toEqual([])
    expect(
      errorsOf(rejectionSchema, { ...other, note: '🐶'.repeat(REJECTION_NOTE_MAX_LENGTH) }),
    ).toEqual([])
    expect(
      errorsOf(rejectionSchema, { ...other, note: 'a'.repeat(REJECTION_NOTE_MAX_LENGTH + 1) }),
    ).toEqual([[['note'], { key: 'inbox.errors.note_too_long' }]])
  })

  it.each([
    ['un teléfono', 'Llamame al 099 123 456', 'phone', '099 123 456'],
    ['un correo', 'Escribime a ana@example.test', 'email', 'ana@example.test'],
    ['un enlace', 'Mirá www.refugio.uy', 'web', 'www.refugio.uy'],
  ])('«otro» con %s no pasa y cita lo que encontró', (_, note, kind, fragment) => {
    expect(errorsOf(rejectionSchema, { ...other, note })).toEqual([
      [[], { key: `inbox.errors.contact_${kind}`, values: { fragment } }],
    ])
  })

  it('una línea larga con un contacto dice primero que es larga', () => {
    const note = `099 123 456 ${'a'.repeat(REJECTION_NOTE_MAX_LENGTH)}`
    expect(errorsOf(rejectionSchema, { ...other, note })).toEqual([
      [['note'], { key: 'inbox.errors.note_too_long' }],
    ])
  })

  it('sin motivo pide elegir uno; «no se concretó» no es para rechazar', () => {
    const missing = [[['reason'], { key: 'inbox.errors.missing_reason' }]]
    expect(errorsOf(rejectionSchema, { id: ID })).toEqual(missing)
    expect(errorsOf(rejectionSchema, { id: ID, reason: 'not_concluded' })).toEqual(missing)
  })

  it('un id que no es uuid no existe', () => {
    const parsed = rejectionSchema.safeParse({ id: 'k3x9p2qa7m', reason: 'housing' })
    expect(parsed.error?.issues[0]?.message).toBe('inbox.errors.not_found')
  })

  it('rechaza un campo de más', () => {
    expect(rejectionSchema.safeParse({ id: ID, reason: 'housing', extra: 1 }).success).toBe(false)
  })
})

describe('revocationSchema', () => {
  it('suma «la adopción no se concretó», sin línea', () => {
    expect(revocationSchema.safeParse({ id: ID, reason: 'not_concluded' })).toEqual({
      success: true,
      data: { id: ID, reason: 'not_concluded', note: null },
    })
  })

  it('los motivos de rechazar también valen, y «otro» pide su línea', () => {
    expect(revocationSchema.safeParse({ id: ID, reason: 'housing' }).success).toBe(true)
    expect(errorsOf(revocationSchema, other)).toEqual([
      [['note'], { key: 'inbox.errors.missing_note' }],
    ])
  })
})

const ATTEMPT = '2c1d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f'

describe.each([
  ['questionSchema', questionSchema, { id: ID, attemptId: ATTEMPT }, 'inbox.errors.'],
  ['answerSchema', answerSchema, { questionId: ID }, 'applications.answer.errors.'],
] as const)('%s', (_, schema, base, prefix) => {
  it('guarda el texto sin los espacios de los bordes', () => {
    expect(schema.safeParse({ ...base, text: '  ¿El balcón tiene red?  ' })).toEqual({
      success: true,
      data: { ...base, text: '¿El balcón tiene red?' },
    })
  })

  it('vacío, de solo espacios o sin texto no se manda', () => {
    const empty = [[['text'], { key: `${prefix}empty` }]]
    expect(errorsOf(schema, { ...base, text: '' })).toEqual(empty)
    expect(errorsOf(schema, { ...base, text: ' \t\n ' })).toEqual(empty)
    expect(errorsOf(schema, base)).toEqual(empty)
  })

  it('acepta 500 caracteres y no 501; un emoji cuenta uno', () => {
    expect(errorsOf(schema, { ...base, text: 'a'.repeat(QUESTION_MAX_LENGTH) })).toEqual([])
    expect(errorsOf(schema, { ...base, text: '🐶'.repeat(QUESTION_MAX_LENGTH) })).toEqual([])
    expect(errorsOf(schema, { ...base, text: 'a'.repeat(QUESTION_MAX_LENGTH + 1) })).toEqual([
      [['text'], { key: `${prefix}too_long` }],
    ])
  })

  it.each([
    ['un teléfono', '¿Me pasás tu número? El mío es 099 123 456', 'phone', '099 123 456'],
    ['un correo', 'Escribime a carla@example.test', 'email', 'carla@example.test'],
    ['un enlace', 'Mirá www.refugio.uy', 'web', 'www.refugio.uy'],
  ])('con %s no se manda y cita lo que encontró', (_label, text, kind, fragment) => {
    expect(errorsOf(schema, { ...base, text })).toEqual([
      [['text'], { key: `${prefix}contact_${kind}`, values: { fragment } }],
    ])
  })

  it('un texto largo con un contacto dice primero que es largo', () => {
    const text = `099 123 456 ${'a'.repeat(QUESTION_MAX_LENGTH)}`
    expect(errorsOf(schema, { ...base, text })).toEqual([[['text'], { key: `${prefix}too_long` }]])
  })

  it('un id que no es uuid no existe; un campo de más no pasa', () => {
    const key = Object.keys(base)[0] ?? ''
    expect(errorsOf(schema, { ...base, [key]: 'k3x9p2qa7m', text: 'Hola' })).toEqual([
      [[key], { key: `${prefix}not_found` }],
    ])
    expect(schema.safeParse({ ...base, text: 'Hola', extra: 1 }).success).toBe(false)
  })
})

describe('questionSchema', () => {
  it('sin un intento válido no se manda', () => {
    expect(errorsOf(questionSchema, { id: ID, attemptId: 'x', text: 'Hola' })).toEqual([
      [['attemptId'], { key: 'inbox.errors.failed' }],
    ])
  })
})
