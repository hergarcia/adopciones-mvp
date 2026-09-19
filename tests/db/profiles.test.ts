// Lo que NO se ve. En esta historia nadie lee el perfil de otra persona: ni su nombre, ni su
// zona, ni la marca de rescatista, ni —sobre todo— su correo (FR-026, FR-026a, FR-026d, SC-005).
// El perfil público llega en la historia #12; hasta entonces la policy es la estrecha, y esto es
// lo que lo demuestra.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { anonClient, asNewUser, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function withProfile(overrides: Record<string, unknown> = {}) {
  const user = await asNewUser()
  cleanups.push(user.cleanup)

  const { error } = await user.client.from('profiles').insert({
    id: user.id,
    display_name: 'Ana García',
    department: 'UY-MO',
    locality: 'Pocitos',
    is_rescuer: false,
    ...overrides,
  })
  expect(error).toBeNull()

  return user
}

describeDb('el perfil de una persona', () => {
  it('lo ve su dueña', async () => {
    const ana = await withProfile()

    const { data } = await ana.client.from('profiles').select('*').eq('id', ana.id)
    expect(data).toHaveLength(1)
    expect(data?.[0]?.display_name).toBe('Ana García')
  })

  it('NO lo ve alguien sin sesión', async () => {
    const ana = await withProfile()

    const { data } = await anonClient().from('profiles').select('*').eq('id', ana.id)
    expect(data).toEqual([])
  })

  it('NO lo ve otra persona con su propia sesión', async () => {
    const ana = await withProfile()
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    const { data } = await juan.client.from('profiles').select('*').eq('id', ana.id)
    expect(data).toEqual([])
  })

  it('NO aparece en un listado sin filtro hecho por otra persona', async () => {
    await withProfile()
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    const { data } = await juan.client.from('profiles').select('*')
    expect(data).toEqual([])
  })

  it('NO se puede escribir el perfil de otra persona', async () => {
    const ana = await withProfile()
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    const { error } = await juan.client
      .from('profiles')
      .update({ display_name: 'Secuestrado' })
      .eq('id', ana.id)
    expect(error).toBeNull()

    // Sin error pero sin efecto: la policy no deja ver la fila, así que no hay nada que cambiar.
    const { data } = await ana.client.from('profiles').select('display_name').eq('id', ana.id)
    expect(data?.[0]?.display_name).toBe('Ana García')
  })

  it('NO se puede crear un perfil a nombre de otra persona', async () => {
    const juan = await asNewUser()
    const ana = await asNewUser()
    cleanups.push(juan.cleanup, ana.cleanup)

    const { error } = await juan.client.from('profiles').insert({
      id: ana.id,
      display_name: 'Impostor',
      department: 'UY-MO',
      locality: 'Centro',
      is_rescuer: false,
    })
    expect(error).not.toBeNull()
  })

  it('NO se puede reasignar el propio perfil a otra persona', async () => {
    const ana = await withProfile()
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    const { error } = await ana.client.from('profiles').update({ id: juan.id }).eq('id', ana.id)
    expect(error).not.toBeNull()
  })

  it('NO se puede borrar el perfil de otra persona', async () => {
    const ana = await withProfile()
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    await juan.client.from('profiles').delete().eq('id', ana.id)

    const { data } = await ana.client.from('profiles').select('id').eq('id', ana.id)
    expect(data).toHaveLength(1)
  })
})

describeDb('el correo de una persona', () => {
  it('NO está guardado en el perfil: vive una sola vez, en el servicio de autenticación', async () => {
    const ana = await withProfile()

    const { data } = await ana.client.from('profiles').select('*').eq('id', ana.id)
    const columns = Object.keys(data?.[0] ?? {})
    expect(columns).not.toContain('email')
    expect(JSON.stringify(data)).not.toContain(ana.email)
  })

  it('NO lo puede leer otra persona por ninguna de las dos puertas', async () => {
    const ana = await withProfile()
    const juan = await asNewUser()
    cleanups.push(juan.cleanup)

    const { data: fromProfile } = await juan.client.from('profiles').select('*').eq('id', ana.id)
    expect(JSON.stringify(fromProfile)).not.toContain(ana.email)

    // La API de administración es la otra puerta, y necesita permisos de servicio: con la sesión
    // de una persona no devuelve nada.
    const { data: fromAdmin, error } = await juan.client.auth.admin.getUserById(ana.id)
    expect(fromAdmin?.user ?? null).toBeNull()
    expect(error).not.toBeNull()
  })

  it('lo ve quien administra el sitio, y solo con permisos de servicio', async () => {
    const ana = await withProfile()

    const { data } = await serviceClient().auth.admin.getUserById(ana.id)
    expect(data?.user?.email).toBe(ana.email)
  })
})

describeDb('las restricciones del perfil también viven en la base', () => {
  it('rechaza un departamento que no está entre los diecinueve', async () => {
    const user = await asNewUser()
    cleanups.push(user.cleanup)

    const { error } = await user.client.from('profiles').insert({
      id: user.id,
      display_name: 'Ana',
      department: 'UY-XX',
      locality: 'Pocitos',
      is_rescuer: false,
    })
    expect(error).not.toBeNull()
  })

  it('rechaza un nombre de una sola letra', async () => {
    const user = await asNewUser()
    cleanups.push(user.cleanup)

    const { error } = await user.client.from('profiles').insert({
      id: user.id,
      display_name: 'A',
      department: 'UY-MO',
      locality: 'Pocitos',
      is_rescuer: false,
    })
    expect(error).not.toBeNull()
  })

  it('rechaza una localidad de solo espacios', async () => {
    const user = await asNewUser()
    cleanups.push(user.cleanup)

    const { error } = await user.client.from('profiles').insert({
      id: user.id,
      display_name: 'Ana García',
      department: 'UY-MO',
      locality: '   ',
      is_rescuer: false,
    })
    expect(error).not.toBeNull()
  })
})
