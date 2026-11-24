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
    for (const bucket of ['pet-photos', 'follow-up-photos']) {
      for (const size of ['thumb', 'card', 'full']) {
        expect(
          sameOriginStorageUrl(`${STORAGE}/${bucket}/${OWNER}/${PHOTO}/${size}.webp?token=xyz`),
        ).toBe(`/fotos/${bucket}/${OWNER}/${PHOTO}/${size}.webp?token=xyz`)
      }
    }
  })

  it('lleva la foto de perfil firmada a /fotos con la firma tal cual', () => {
    expect(sameOriginStorageUrl(`${STORAGE}/avatars/${OWNER}/avatar.webp?token=xyz`)).toBe(
      `/fotos/avatars/${OWNER}/avatar.webp?token=xyz`,
    )
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
      `${STORAGE}/follow-up-photos/${OWNER}/card.webp?token=xyz`,
      `${STORAGE}/avatars/${OWNER}/${PHOTO}/avatar.webp?token=xyz`,
      `${STORAGE}/avatars/${OWNER}/avatar.png?token=xyz`,
      `${STORAGE}/avatars/${OWNER}/avatarxwebp?token=xyz`,
      `${STORAGE}/avatars/x${OWNER}/avatar.webp?token=xyz`,
      `${STORAGE}/avatars/${OWNER}/avatar.webp.png?token=xyz`,
      `${STORAGE}/x/avatars/${OWNER}/avatar.webp?token=xyz`,
      'blob:http://localhost:3000/123',
      'no es una dirección',
    ]
    for (const url of untouched) expect(sameOriginStorageUrl(url)).toBe(url)
  })
})

describe('storageRewrites', () => {
  it('reenvía solo la forma de cada foto a su objeto firmado en el origen de Supabase', () => {
    expect(storageRewrites('https://abc.supabase.co/')).toEqual([
      {
        source: `/fotos/pet-photos/:owner(${ID})/:photo(${ID})/:size(thumb|card|full).webp`,
        destination: `${STORAGE}/pet-photos/:owner/:photo/:size.webp`,
      },
      {
        source: `/fotos/follow-up-photos/:owner(${ID})/:photo(${ID})/:size(thumb|card|full).webp`,
        destination: `${STORAGE}/follow-up-photos/:owner/:photo/:size.webp`,
      },
      {
        source: `/fotos/avatars/:owner(${ID})/avatar.webp`,
        destination: `${STORAGE}/avatars/:owner/avatar.webp`,
      },
    ])
  })

  it('sin la dirección de Supabase no reenvía nada', () => {
    expect(storageRewrites(undefined)).toEqual([])
    expect(storageRewrites('')).toEqual([])
  })
})
