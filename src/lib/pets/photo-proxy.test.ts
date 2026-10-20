// Covers: la portada pedida por el mismo origen (#169, LCP), con la firma intacta (FR-018 de #57).
import { describe, expect, it } from 'vitest'
import { photoRewrites, sameOriginPhotoUrl } from './photo-proxy'

const STORAGE = 'https://abc.supabase.co/storage/v1/object/sign'

describe('sameOriginPhotoUrl', () => {
  it('lleva la URL firmada a /fotos con la ruta y la firma tal cual', () => {
    expect(sameOriginPhotoUrl(`${STORAGE}/pet-photos/dueña/foto/card.webp?token=xyz`)).toBe(
      '/fotos/pet-photos/due%C3%B1a/foto/card.webp?token=xyz',
    )
  })

  it('deja como estaba lo que no es una URL firmada de Storage', () => {
    const publicUrl = 'https://abc.supabase.co/storage/v1/object/public/pet-photos/a.webp'
    expect(sameOriginPhotoUrl(publicUrl)).toBe(publicUrl)
    expect(sameOriginPhotoUrl('https://abc.supabase.co/storage/v1/object/signed/a.webp')).toBe(
      'https://abc.supabase.co/storage/v1/object/signed/a.webp',
    )
    expect(sameOriginPhotoUrl('blob:http://localhost:3000/123')).toBe(
      'blob:http://localhost:3000/123',
    )
    expect(sameOriginPhotoUrl('no es una dirección')).toBe('no es una dirección')
  })
})

describe('photoRewrites', () => {
  it('reenvía /fotos a los objetos firmados del origen de Supabase', () => {
    expect(photoRewrites('https://abc.supabase.co/')).toEqual([
      { source: '/fotos/:path*', destination: `${STORAGE}/:path*` },
    ])
  })

  it('sin la dirección de Supabase no reenvía nada', () => {
    expect(photoRewrites(undefined)).toEqual([])
    expect(photoRewrites('')).toEqual([])
  })
})
