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
