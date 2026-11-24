// Covers: #356. En el servidor, sin clave de Resend, el enlace de ingreso no se escribe a disco.
import { describe, expect, it } from 'vitest'
import { mailTransport } from './mail-transport'

describe('mailTransport', () => {
  it('con clave sale por Resend, en local o en el servidor', () => {
    expect(mailTransport({ apiKey: 're_clave', deployEnv: undefined })).toBe('resend')
    expect(mailTransport({ apiKey: 're_clave', deployEnv: 'production' })).toBe('resend')
  })

  it('sin clave y en local va a archivo, para los e2e', () => {
    expect(mailTransport({ apiKey: undefined, deployEnv: undefined })).toBe('outbox')
  })

  it('sin clave en el servidor no sale', () => {
    expect(mailTransport({ apiKey: undefined, deployEnv: 'production' })).toBe('none')
  })
})
