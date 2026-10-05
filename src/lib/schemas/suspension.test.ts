// Covers: FR-018, US2-AS3 (lo que llega a suspender y a reactivar, en la hoja y en la acción)
import { describe, expect, it } from 'vitest'
import { SUSPENSION_REASON_MAX } from '@/lib/moderation/rules'
import { reactivateSchema, suspensionSchema } from './suspension'

const PUBLIC_ID = 'AbCdEfGhIjKlMnOpQrSt_-'
const REPORT_ID = '0b5f8f9e-6a3c-4d1e-9f2a-7c8b9d0e1f2a'
const base = { publicId: PUBLIC_ID }

function errorsOf(input: unknown) {
  const parsed = suspensionSchema.safeParse(input)
  return parsed.success ? [] : parsed.error.issues.map((issue) => [issue.path, issue.message])
}

describe('suspensionSchema', () => {
  it('guarda el motivo sin los bordes, sin reporte o con el reporte de la lista', () => {
    expect(suspensionSchema.parse({ ...base, reason: '  Vendía cachorros  ' })).toEqual({
      ...base,
      reason: 'Vendía cachorros',
    })
    expect(suspensionSchema.parse({ ...base, reason: 'Estafa', reportId: REPORT_ID })).toEqual({
      ...base,
      reason: 'Estafa',
      reportId: REPORT_ID,
    })
  })

  it('sin motivo, vacío o con solo espacios, pide el motivo', () => {
    const required = [[['reason'], 'moderation.errors.reason_required']]
    expect(errorsOf(base)).toEqual(required)
    expect(errorsOf({ ...base, reason: '' })).toEqual(required)
    expect(errorsOf({ ...base, reason: ' \n\t ' })).toEqual(required)
  })

  it('acepta 1000 caracteres y rechaza 1001, contados como la base', () => {
    const emoji = '🐶'
    expect(errorsOf({ ...base, reason: 'a'.repeat(SUSPENSION_REASON_MAX) })).toEqual([])
    expect(errorsOf({ ...base, reason: emoji.repeat(SUSPENSION_REASON_MAX) })).toEqual([])
    const tooLong = [[['reason'], 'moderation.errors.reason_too_long']]
    expect(errorsOf({ ...base, reason: 'a'.repeat(SUSPENSION_REASON_MAX + 1) })).toEqual(tooLong)
    expect(errorsOf({ ...base, reason: ` ${'a'.repeat(SUSPENSION_REASON_MAX)} ` })).toEqual([])
  })

  it('un reporte que no es un uuid, o una persona mal escrita, no existen', () => {
    expect(errorsOf({ ...base, reason: 'Estafa', reportId: 'no-es-un-uuid' })).toEqual([
      [['reportId'], 'moderation.errors.gone'],
    ])
    expect(errorsOf({ publicId: 'corto', reason: 'Estafa' })).toEqual([
      [['publicId'], 'moderation.errors.gone'],
    ])
    expect(errorsOf({ reason: 'Estafa' })).toEqual([[['publicId'], 'moderation.errors.gone']])
  })

  it('no acepta campos de más', () => {
    expect(suspensionSchema.safeParse({ ...base, reason: 'Estafa', by: 'x' }).success).toBe(false)
  })
})

describe('reactivateSchema', () => {
  it('pide el id de la suspensión, y nada más', () => {
    expect(reactivateSchema.parse({ suspensionId: REPORT_ID })).toEqual({ suspensionId: REPORT_ID })
    expect(reactivateSchema.safeParse({ suspensionId: 'x' }).success).toBe(false)
    expect(reactivateSchema.safeParse({ suspensionId: REPORT_ID, x: 1 }).success).toBe(false)
  })
})
