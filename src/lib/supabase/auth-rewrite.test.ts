// Covers: entrar con Google con Supabase sin dirección pública (#356): el navegador va a la
// autorización por el origen del sitio, y desde afuera no se llega a nada más de Auth.
import { describe, expect, it } from 'vitest'
import { authRewrites, sameOriginAuthUrl } from './auth-rewrite'

const SITE = 'https://homelab.example.test:10000'
const INTERNAL = 'http://adopciones-api-gw:8000'

describe('sameOriginAuthUrl', () => {
  it('lleva la autorización al origen del sitio con la consulta tal cual', () => {
    expect(
      sameOriginAuthUrl(
        `${INTERNAL}/auth/v1/authorize?provider=google&redirect_to=x&code_challenge=abc`,
        `${SITE}/`,
      ),
    ).toBe(`${SITE}/auth/v1/authorize?provider=google&redirect_to=x&code_challenge=abc`)
  })

  it('deja como estaba lo que no es la autorización', () => {
    const untouched = [
      `${INTERNAL}/auth/v1/token?grant_type=pkce`,
      `${INTERNAL}/auth/v1/authorize/otra`,
      `${INTERNAL}/x/auth/v1/authorize?provider=google`,
      'no es una dirección',
    ]
    for (const url of untouched) expect(sameOriginAuthUrl(url, SITE)).toBe(url)
  })
})

describe('authRewrites', () => {
  it('reenvía solo la autorización y la vuelta de Google al origen de Supabase', () => {
    expect(authRewrites(`${INTERNAL}/`)).toEqual([
      { source: '/auth/v1/authorize', destination: `${INTERNAL}/auth/v1/authorize` },
      { source: '/auth/v1/callback', destination: `${INTERNAL}/auth/v1/callback` },
    ])
  })

  it('sin la dirección de Supabase no reenvía nada', () => {
    expect(authRewrites(undefined)).toEqual([])
    expect(authRewrites('')).toEqual([])
  })
})
