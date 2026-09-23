// El teléfono verificado no es una forma de entrar (FR-009d, historia #10): el código lo genera y lo
// comprueba el producto, y el servicio de autenticación no manda ninguno. Esa regla vive en
// supabase/config.toml, que se prende sin querer, así que acá se lee y se demuestra fallando con
// un fixture que la viola. El proyecto en la nube se configura aparte y esto no lo ve (M5).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Las claves que, encendidas, dejan entrar con el teléfono o mandan un código por fuera de la
// verificación del producto. `auth.sms.*` son los proveedores de mensajes del servicio.
function phoneSignInProblems(toml: string): string[] {
  const problems: string[] = []
  let section = ''

  for (const raw of toml.split('\n')) {
    const line = raw.trim()
    if (line === '' || line.startsWith('#')) continue

    const header = /^\[([^\]]+)\]$/.exec(line)
    if (header) {
      section = header[1] ?? ''
      continue
    }

    const setting = /^(\w+)\s*=\s*true\b/.exec(line)
    if (!setting) continue
    const key = setting[1]

    if (section === 'auth.sms' && key === 'enable_signup') problems.push(`[${section}] ${key}`)
    if (section.startsWith('auth.sms.') && key === 'enabled') problems.push(`[${section}] ${key}`)
    if (section === 'auth.mfa.phone' && (key === 'enroll_enabled' || key === 'verify_enabled')) {
      problems.push(`[${section}] ${key}`)
    }
  }
  return problems
}

describe('el teléfono no es una llave', () => {
  it('en el config.toml del repo, nada deja entrar con el teléfono ni manda códigos', () => {
    expect(phoneSignInProblems(readFileSync('supabase/config.toml', 'utf8'))).toEqual([])
  })

  it('el fixture bueno pasa', () => {
    const good = readFileSync('tests/gates/fixtures/phone-sign-in/good/config.toml', 'utf8')
    expect(phoneSignInProblems(good)).toEqual([])
  })

  it('el fixture malo falla por las tres puertas', () => {
    const bad = readFileSync('tests/gates/fixtures/phone-sign-in/bad/config.toml', 'utf8')
    expect(phoneSignInProblems(bad)).toEqual([
      '[auth.sms] enable_signup',
      '[auth.sms.twilio_verify] enabled',
      '[auth.mfa.phone] enroll_enabled',
    ])
  })
})
