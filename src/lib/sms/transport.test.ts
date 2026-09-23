import { describe, expect, it } from 'vitest'
import { smsTransport } from './transport'

const TWILIO = { accountSid: 'AC1', authToken: 'token', messagingServiceSid: 'MG1' }
const NONE = { accountSid: undefined, authToken: undefined, messagingServiceSid: undefined }

// Covers: FR-009c
describe('por dónde sale un código', () => {
  it('con las tres credenciales de Twilio, por Twilio, sea cual sea la base', () => {
    expect(smsTransport({ ...TWILIO, supabaseUrl: 'https://abc.supabase.co' })).toBe('twilio')
    expect(smsTransport({ ...TWILIO, supabaseUrl: 'http://127.0.0.1:54321' })).toBe('twilio')
  })

  it('sin credenciales y contra la base local, a disco', () => {
    expect(smsTransport({ ...NONE, supabaseUrl: 'http://127.0.0.1:54321' })).toBe('outbox')
    expect(smsTransport({ ...NONE, supabaseUrl: 'http://localhost:54321' })).toBe('outbox')
  })

  it('sin credenciales y contra cualquier otra base, por ningún lado: nunca a disco', () => {
    expect(smsTransport({ ...NONE, supabaseUrl: 'https://abc.supabase.co' })).toBe('none')
    expect(smsTransport({ ...NONE, supabaseUrl: 'http://127.0.0.1.example.com' })).toBe('none')
  })

  it('con credenciales incompletas, nunca por Twilio', () => {
    const cloud = 'https://abc.supabase.co'
    expect(smsTransport({ ...TWILIO, authToken: undefined, supabaseUrl: cloud })).toBe('none')
    expect(smsTransport({ ...TWILIO, accountSid: undefined, supabaseUrl: cloud })).toBe('none')
    expect(smsTransport({ ...TWILIO, messagingServiceSid: undefined, supabaseUrl: cloud })).toBe(
      'none',
    )
    expect(
      smsTransport({ ...NONE, accountSid: 'AC1', supabaseUrl: 'http://127.0.0.1:54321' }),
    ).toBe('outbox')
  })

  it('con una dirección de base que no se entiende, por ningún lado', () => {
    expect(smsTransport({ ...NONE, supabaseUrl: 'no es una url' })).toBe('none')
  })
})
