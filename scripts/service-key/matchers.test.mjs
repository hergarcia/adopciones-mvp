import { describe, expect, it } from 'vitest'
import { problemsIn } from './matchers.mjs'

const jwt = (role) =>
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ iss: 'supabase-demo', role, exp: 1983812996 })).toString('base64url')}.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`

describe('la clave de servicio no llega al browser ni a git', () => {
  it('un nombre con el prefijo público que nombra la clave de servicio es un problema', () => {
    expect(
      problemsIn('src/lib/x.ts', 'const k = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'),
    ).toHaveLength(1)
  })

  it('el nombre correcto, sin prefijo público, no lo es', () => {
    expect(problemsIn('src/lib/x.ts', 'process.env.SUPABASE_SERVICE_ROLE_KEY')).toEqual([])
  })

  it('la clave anónima sí puede llevar el prefijo público', () => {
    expect(problemsIn('.env.example', 'NEXT_PUBLIC_SUPABASE_ANON_KEY=')).toEqual([])
  })

  it('un JWT con rol de servicio escrito literal es un problema', () => {
    expect(problemsIn('docs/x.md', `clave: ${jwt('service_role')}`)).toHaveLength(1)
  })

  it('una clave de servicio detrás de una anónima en el mismo renglón también', () => {
    const line = JSON.stringify({ ANON_KEY: jwt('anon'), SERVICE_ROLE_KEY: jwt('service_role') })
    expect(problemsIn('docs/x.md', line)).toHaveLength(1)
  })

  it('los otros nombres de una clave privada con el prefijo público también', () => {
    expect(problemsIn('src/lib/x.ts', 'process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY')).toHaveLength(
      1,
    )
    expect(problemsIn('src/lib/x.ts', 'process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY')).toHaveLength(
      1,
    )
  })

  it('una clave secret escrita literal también, aunque no sea un JWT', () => {
    expect(problemsIn('docs/x.md', `SECRET_KEY=sb_secret_${'a1B2'.repeat(8)}`)).toHaveLength(1)
    expect(problemsIn('docs/x.md', 'PUBLISHABLE_KEY=sb_publishable_' + 'a1B2'.repeat(8))).toEqual(
      [],
    )
  })

  it('un JWT anónimo no lo es', () => {
    expect(problemsIn('docs/x.md', `clave: ${jwt('anon')}`)).toEqual([])
  })

  it('.env.example con un valor real en la clave de servicio es un problema', () => {
    expect(problemsIn('.env.example', 'SUPABASE_SERVICE_ROLE_KEY=abc')).toHaveLength(1)
    expect(problemsIn('.env.example', 'SUPABASE_SERVICE_ROLE_KEY=')).toEqual([])
  })

  it('ese mismo renglón en otro archivo no cuenta como .env.example', () => {
    expect(problemsIn('README.md', 'SUPABASE_SERVICE_ROLE_KEY=abc')).toEqual([])
  })
})

// La de Resend no saltea RLS, pero manda correo en nombre del dominio: versionada, cualquiera
// manda correo que parece nuestro, que es de lo que vive el phishing.
describe('la clave de Resend tampoco', () => {
  // Inventada, con la forma de una de verdad. Una clave real acá sería un secreto versionado,
  // y este directorio está exento de la compuerta —nombra los patrones a propósito— así que la
  // compuerta no la vería. La protección de GitHub sí: ya frenó un push por esto.
  const clave = 're_FAKEfake_000000000000000000fake'

  it('escrita literal en un archivo versionado es un problema', () => {
    expect(problemsIn('docs/x.md', `clave: ${clave}`)).toContain(
      'hay una clave de Resend escrita literal y versionada',
    )
  })

  it('en .env.example, dos: el valor y que el ejemplo tiene que quedar vacío', () => {
    expect(problemsIn('.env.example', `RESEND_API_KEY=${clave}`)).toHaveLength(2)
  })

  it('el ejemplo sin valor pasa', () => {
    expect(problemsIn('.env.example', 'RESEND_API_KEY=')).toEqual([])
  })

  it('un identificador que empieza igual no se acusa', () => {
    expect(problemsIn('src/x.ts', 'const re_export = 1')).toEqual([])
    expect(problemsIn('src/x.ts', 'import { re_exportar } from "./x"')).toEqual([])
  })

  it('una API_KEY con el prefijo público es un problema aunque no sea de servicio', () => {
    expect(problemsIn('src/x.ts', 'process.env.NEXT_PUBLIC_RESEND_API_KEY')).toHaveLength(1)
  })

  it('la clave anónima sigue pudiendo ser pública', () => {
    expect(problemsIn('.env.example', 'NEXT_PUBLIC_SUPABASE_ANON_KEY=')).toEqual([])
  })
})

// El token de Twilio manda mensajes pagos en nombre de la cuenta (historia #10).
describe('el token de Twilio tampoco', () => {
  it('con el prefijo público es un problema', () => {
    expect(problemsIn('src/x.ts', 'process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN')).toHaveLength(1)
  })

  it('en .env.example con un valor es un problema', () => {
    expect(problemsIn('.env.example', 'TWILIO_AUTH_TOKEN=0123456789abcdef')).toContain(
      '.env.example trae un valor real en TWILIO_AUTH_TOKEN; tiene que quedar vacío',
    )
  })

  it('el ejemplo sin valor pasa, y el SID de la cuenta no es un secreto', () => {
    expect(problemsIn('.env.example', 'TWILIO_AUTH_TOKEN=')).toEqual([])
    expect(problemsIn('src/x.ts', 'process.env.TWILIO_ACCOUNT_SID')).toEqual([])
  })
})
