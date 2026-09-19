// La foto es la cara de la persona y es el dato más fácil de filtrar sin darse cuenta: un bucket
// público, o una dirección adivinable, y queda expuesta antes de que exista ninguna solicitud
// aceptada. Esto demuestra que no (FR-026c, SC-005).
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { anonClient, asNewUser, type SyntheticUser } from './roles'

const BUCKET = 'avatars'
const cleanups: SyntheticUser['cleanup'][] = []

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

function webp() {
  return new Blob([new Uint8Array([82, 73, 70, 70])], { type: 'image/webp' })
}

async function withAvatar() {
  const user = await asNewUser()
  cleanups.push(user.cleanup)

  const path = `${user.id}/avatar.webp`
  const { error } = await user.client.storage
    .from(BUCKET)
    .upload(path, webp(), { contentType: 'image/webp', upsert: true })
  expect(error).toBeNull()

  return { user, path }
}

describeDb('la foto de perfil', () => {
  it('la puede subir y volver a bajar su dueña', async () => {
    const { user, path } = await withAvatar()

    const { data, error } = await user.client.storage.from(BUCKET).download(path)
    expect(error).toBeNull()
    expect(data).not.toBeNull()
  })

  it('NO se baja sin sesión, aunque se sepa la dirección exacta', async () => {
    const { path } = await withAvatar()

    const { data, error } = await anonClient().storage.from(BUCKET).download(path)
    expect(data).toBeNull()
    expect(error).not.toBeNull()
  })

  it('NO se baja con la sesión de otra persona', async () => {
    const { path } = await withAvatar()
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    const { data, error } = await juan.client.storage.from(BUCKET).download(path)
    expect(data).toBeNull()
    expect(error).not.toBeNull()
  })

  it('NO se puede pedir una URL firmada de la foto ajena', async () => {
    const { path } = await withAvatar()
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    const { data, error } = await juan.client.storage.from(BUCKET).createSignedUrl(path, 60)
    expect(data?.signedUrl ?? null).toBeNull()
    expect(error).not.toBeNull()
  })

  it('NO se puede escribir en la carpeta de otra persona', async () => {
    const { user } = await withAvatar()
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    const { error } = await juan.client.storage
      .from(BUCKET)
      .upload(`${user.id}/avatar.webp`, webp(), { contentType: 'image/webp', upsert: true })
    expect(error).not.toBeNull()
  })

  it('NO se puede borrar la foto de otra persona', async () => {
    const { user, path } = await withAvatar()
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    await juan.client.storage.from(BUCKET).remove([path])

    const { error } = await user.client.storage.from(BUCKET).download(path)
    expect(error).toBeNull()
  })

  it('su dueña sí la puede reemplazar: sin update, el upsert falla en silencio', async () => {
    const { user, path } = await withAvatar()

    const { error } = await user.client.storage
      .from(BUCKET)
      .upload(path, webp(), { contentType: 'image/webp', upsert: true })
    expect(error).toBeNull()
  })

  it('su dueña sí la puede quitar', async () => {
    const { user, path } = await withAvatar()

    await user.client.storage.from(BUCKET).remove([path])

    const { error } = await user.client.storage.from(BUCKET).download(path)
    expect(error).not.toBeNull()
  })
})
