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
