import { expect } from '@playwright/test'
import sharp from 'sharp'
import { service } from './pet-owner'

const avatarPath = (ownerId: string) => `${ownerId}/avatar.webp`

// Una foto de 400 px con grano, como una de verdad, y la persona marcada como rescatista: el perfil en
// su versión más pesada.
export async function uploadAvatar(ownerId: string): Promise<void> {
  const avatar = await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 3,
      background: { r: 200, g: 140, b: 90 },
      noise: { type: 'gaussian', mean: 128, sigma: 10 },
    },
  })
    .webp({ quality: 80 })
    .toBuffer()
  const db = service()
  const upload = await db.storage
    .from('avatars')
    .upload(avatarPath(ownerId), avatar, { contentType: 'image/webp', upsert: true })
  expect(upload.error).toBeNull()
  const profile = await db
    .from('profiles')
    .update({ avatar_path: avatarPath(ownerId), is_rescuer: true })
    .eq('id', ownerId)
  expect(profile.error).toBeNull()
}

export async function removeAvatar(ownerId: string): Promise<void> {
  await service()
    .storage.from('avatars')
    .remove([avatarPath(ownerId)])
}
