// La tabla de enlaces tiene RLS habilitada y CERO policies: nadie la lee desde el cliente, ni
// siquiera la dueña de la dirección. La tocan solo las acciones con permisos de servicio, y
// guarda direcciones en claro durante siete días, así que lo que hay que demostrar es que no se
// filtra por ningún lado (FR-030a).
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { anonClient, asNewUser, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const rows: string[] = []

afterEach(async () => {
  const ids = rows.splice(0)
  if (ids.length > 0) await serviceClient().from('login_links').delete().in('id', ids)

  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function seedLink(email: string): Promise<string> {
  const { data, error } = await serviceClient()
    .from('login_links')
    .insert({
      email,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      delivery: 'sent',
    })
    .select('id')
    .single()

  expect(error).toBeNull()
  rows.push(data!.id)
  return data!.id
}

describeDb('el registro de enlaces de ingreso', () => {
  it('NO lo lee nadie sin sesión', async () => {
    await seedLink('ana@example.test')

    const { data } = await anonClient().from('login_links').select('*')
    expect(data).toEqual([])
  })

  it('NO lo lee una persona con sesión, ni siquiera la dueña de la dirección', async () => {
    const ana = await asNewUser()
    cleanups.push(ana.cleanup)
    await seedLink(ana.email)

    const { data } = await ana.client.from('login_links').select('*')
    expect(data).toEqual([])
  })

  it('NO se puede escribir en él desde el cliente', async () => {
    const ana = await asNewUser()
    cleanups.push(ana.cleanup)

    const { error } = await ana.client.from('login_links').insert({
      email: 'otra@example.test',
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      delivery: 'sent',
    })
    expect(error).not.toBeNull()
  })

  it('NO se puede marcar un enlace ajeno como usado', async () => {
    const id = await seedLink('ana@example.test')
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    await juan.client
      .from('login_links')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', id)

    const { data } = await serviceClient().from('login_links').select('consumed_at').eq('id', id)
    expect(data?.[0]?.consumed_at).toBeNull()
  })

  it('con permisos de servicio sí se lee: es como lo tocan las acciones', async () => {
    const id = await seedLink('ana@example.test')

    const { data } = await serviceClient().from('login_links').select('email').eq('id', id)
    expect(data?.[0]?.email).toBe('ana@example.test')
  })

  it('la base rechaza un enlace que vence antes de emitirse', async () => {
    const { error } = await serviceClient()
      .from('login_links')
      .insert({
        email: 'ana@example.test',
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() - 1000).toISOString(),
        delivery: 'sent',
      })
    expect(error).not.toBeNull()
  })

  it('la base rechaza un motivo de entrega que no existe', async () => {
    const { error } = await serviceClient()
      .from('login_links')
      .insert({
        email: 'ana@example.test',
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        delivery: 'quien sabe',
      })
    expect(error).not.toBeNull()
  })
})
