// Covers: la portada pedida por el mismo origen (#169, LCP), con la firma intacta (FR-018 de #57).
import { describe, expect, it } from 'vitest'
import { storageRewrites, sameOriginStorageUrl } from './storage-rewrite'

const STORAGE = 'https://abc.supabase.co/storage/v1/object/sign'

describe('sameOriginStorageUrl', () => {
  it('lleva la URL firmada a /fotos con la ruta y la firma tal cual', () => {
    expect(sameOriginStorageUrl(`${STORAGE}/pet-photos/dueña/foto/card.webp?token=xyz`)).toBe(
      '/fotos/pet-photos/due%C3%B1a/foto/card.webp?token=xyz',
    )
  })

  it('deja como estaba lo que no es una URL firmada de Storage', () => {
    const publicUrl = 'https://abc.supabase.co/storage/v1/object/public/pet-photos/a.webp'
    expect(sameOriginStorageUrl(publicUrl)).toBe(publicUrl)
    expect(sameOriginStorageUrl('https://abc.supabase.co/storage/v1/object/signed/a.webp')).toBe(
      'https://abc.supabase.co/storage/v1/object/signed/a.webp',
    )
    expect(sameOriginStorageUrl('blob:http://localhost:3000/123')).toBe(
      'blob:http://localhost:3000/123',
    )
    expect(sameOriginStorageUrl('no es una dirección')).toBe('no es una dirección')
  })
})

describe('storageRewrites', () => {
  it('reenvía /fotos a los objetos firmados del origen de Supabase', () => {
    expect(storageRewrites('https://abc.supabase.co/')).toEqual([
      { source: '/fotos/:path*', destination: `${STORAGE}/:path*` },
    ])
  })

  it('sin la dirección de Supabase no reenvía nada', () => {
    expect(storageRewrites(undefined)).toEqual([])
    expect(storageRewrites('')).toEqual([])
  })
})
