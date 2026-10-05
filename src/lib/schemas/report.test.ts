// Covers: FR-003, US1-AS3 (lo que llega a reportar, en la hoja y en la acción)
import { describe, expect, it } from 'vitest'
import { REPORT_DETAILS_MAX } from '@/lib/moderation/rules'
import { REPORT_REASONS } from '@/lib/moderation/types'
import { closeReportSchema, reportSchema } from './report'

const PUBLIC_ID = 'AbCdEfGhIjKlMnOpQrSt_-'
const base = { publicId: PUBLIC_ID }

function errorsOf(input: unknown) {
  const parsed = reportSchema.safeParse(input)
  return parsed.success ? [] : parsed.error.issues.map((issue) => [issue.path, issue.message])
}

describe('reportSchema', () => {
  it.each(REPORT_REASONS.filter((reason) => reason !== 'other'))(
    'acepta «%s» sin texto, y lo guarda nulo',
    (reason) => {
      expect(reportSchema.safeParse({ ...base, reason })).toEqual({
        success: true,
        data: { ...base, reason, details: null },
      })
    },
  )

  it('los seis motivos son los de la historia', () => {
    expect(REPORT_REASONS).toEqual([
      'scam',
      'animal_abuse',
      'sells_animals',
      'impersonation',
      'harassment',
      'other',
    ])
  })

  it('rechaza un motivo que no está en la lista, o ninguno', () => {
    expect(errorsOf({ ...base, reason: 'spam' })).toEqual([
      [['reason'], 'moderation.errors.reason_required'],
    ])
    expect(errorsOf(base)).toEqual([[['reason'], 'moderation.errors.reason_required']])
  })

  it('un motivo que no es «otro» guarda el texto sin los bordes, y el vacío como nulo', () => {
    const reason = 'sells_animals'
    expect(reportSchema.parse({ ...base, reason, details: '  Me ofreció un cachorro  ' })).toEqual({
      ...base,
      reason,
      details: 'Me ofreció un cachorro',
    })
    expect(reportSchema.parse({ ...base, reason, details: '   ' })).toEqual({
      ...base,
      reason,
      details: null,
    })
  })

  it('«otro» sin texto, o con solo espacios, pide contar qué pasó', () => {
    const required = [[['details'], 'moderation.errors.details_required']]
    expect(errorsOf({ ...base, reason: 'other' })).toEqual(required)
    expect(errorsOf({ ...base, reason: 'other', details: '  \n ' })).toEqual(required)
  })

  it('«otro» con texto lo guarda sin los bordes', () => {
    expect(reportSchema.parse({ ...base, reason: 'other', details: ' Rifa animales ' })).toEqual({
      ...base,
      reason: 'other',
      details: 'Rifa animales',
    })
  })

  it('acepta 1000 caracteres y no 1001, con cualquier motivo', () => {
    for (const reason of ['other', 'scam']) {
      expect(errorsOf({ ...base, reason, details: 'a'.repeat(REPORT_DETAILS_MAX) })).toEqual([])
      expect(errorsOf({ ...base, reason, details: 'a'.repeat(REPORT_DETAILS_MAX + 1) })).toEqual([
        [['details'], 'moderation.errors.details_too_long'],
      ])
    }
  })

  it('cuenta los caracteres como la base: un emoji es uno', () => {
    expect(
      errorsOf({ ...base, reason: 'other', details: '🐶'.repeat(REPORT_DETAILS_MAX) }),
    ).toEqual([])
  })

  it('un id público mal formado es un perfil que no existe', () => {
    for (const publicId of ['corto', `${PUBLIC_ID}x`, 'AbCdEfGhIjKlMnOpQrSt.-', 42]) {
      expect(errorsOf({ publicId, reason: 'scam' })).toEqual([
        [['publicId'], 'moderation.errors.not_found'],
      ])
    }
  })

  it('no acepta campos de más', () => {
    expect(reportSchema.safeParse({ ...base, reason: 'scam', reporterId: 'x' }).success).toBe(false)
  })
})

describe('closeReportSchema', () => {
  it('acepta el id de un reporte y nada más', () => {
    const reportId = '7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a'
    expect(closeReportSchema.safeParse({ reportId })).toEqual({ success: true, data: { reportId } })
    expect(closeReportSchema.safeParse({ reportId: 'no-es-un-id' }).success).toBe(false)
    expect(closeReportSchema.safeParse({}).success).toBe(false)
    expect(closeReportSchema.safeParse({ reportId, adminId: reportId }).success).toBe(false)
  })
})
