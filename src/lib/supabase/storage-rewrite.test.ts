// Covers: la portada pedida por el mismo origen (#169, LCP), con la firma intacta (FR-018 de #57),
// y nada más que una foto por ese camino.
import { describe, expect, it } from 'vitest'
import { sameOriginStorageUrl, storageRewrites } from './storage-rewrite'

const STORAGE = 'https://abc.supabase.co/storage/v1/object/sign'
const OWNER = '11111111-1111-1111-1111-111111111111'
const PHOTO = 'aaaaaaaa-0000-4000-8000-00000000000f'
const ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

describe('sameOriginStorageUrl', () => {
  it('lleva cada tamaño de una foto firmada a /fotos con la firma tal cual', () => {
    for (const size of ['thumb', 'card', 'full']) {
      expect(
        sameOriginStorageUrl(`${STORAGE}/pet-photos/${OWNER}/${PHOTO}/${size}.webp?token=xyz`),
      ).toBe(`/fotos/pet-photos/${OWNER}/${PHOTO}/${size}.webp?token=xyz`)
    }
  })

  it('deja como estaba lo que no tiene la forma exacta de una foto firmada', () => {
    const untouched = [
      `https://abc.supabase.co/storage/v1/object/public/pet-photos/${OWNER}/${PHOTO}/card.webp`,
      `https://abc.supabase.co/storage/v1/object/signed/pet-photos/${OWNER}/${PHOTO}/card.webp`,
      `${STORAGE}/avatars/${OWNER}/${PHOTO}/card.webp?token=xyz`,
      `${STORAGE}/pet-photos/${OWNER}/${PHOTO}/other.webp?token=xyz`,
      `${STORAGE}/pet-photos/${OWNER}/${PHOTO}/cardxwebp?token=xyz`,
      `${STORAGE}/pet-photos/${OWNER}/${PHOTO}/card.webp.png?token=xyz`,
      `${STORAGE}/pet-photos/x${OWNER}/${PHOTO}/card.webp?token=xyz`,
      `${STORAGE}/pet-photos/${OWNER}/${PHOTO}x/card.webp?token=xyz`,
      `${STORAGE}/pet-photos/%2e%2e/${PHOTO}/card.webp?token=xyz`,
      `${STORAGE}/x/pet-photos/${OWNER}/${PHOTO}/card.webp?token=xyz`,
      'blob:http://localhost:3000/123',
      'no es una dirección',
    ]
    for (const url of untouched) expect(sameOriginStorageUrl(url)).toBe(url)
  })
})

describe('storageRewrites', () => {
  it('reenvía solo la forma de una foto a su objeto firmado en el origen de Supabase', () => {
    expect(storageRewrites('https://abc.supabase.co/')).toEqual([
      {
        source: `/fotos/pet-photos/:owner(${ID})/:photo(${ID})/:size(thumb|card|full).webp`,
        destination: `${STORAGE}/pet-photos/:owner/:photo/:size.webp`,
      },
    ])
  })

  it('sin la dirección de Supabase no reenvía nada', () => {
    expect(storageRewrites(undefined)).toEqual([])
    expect(storageRewrites('')).toEqual([])
  })
})
