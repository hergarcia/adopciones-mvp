// La limpieza de cuentas sin confirmar corre con permisos de servicio en el camino anónimo de
// pedir un enlace, y borra personas. El predicado puro tiene su test al lado; esto prueba lo otro,
// que es a quién se le pasa de verdad contra la base: una confirmada y una reciente tienen que
// sobrevivir (FR-030a).
//
// Las cuentas se crean ahora y la limpieza se llama **desde el futuro**, que es para lo que
// `purgeUnconfirmedAccounts` recibe `now`: envejecer filas a mano pediría SQL crudo, y acá alcanza
// con mover el reloj.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { serviceClient } from './roles'
import { purgeUnconfirmedAccounts } from '../../src/lib/auth/accounts'
import { UNCONFIRMED_ACCOUNT_TTL_DAYS } from '../../src/lib/auth/stale-accounts'

const DAY_MS = 24 * 60 * 60 * 1000
const created: string[] = []

afterEach(async () => {
  const ids = created.splice(0)
  const service = serviceClient()
  await Promise.all(ids.map((id) => service.auth.admin.deleteUser(id).catch(() => undefined)))
})

function inDays(days: number): Date {
  return new Date(Date.now() + days * DAY_MS)
}

async function person(confirmed: boolean): Promise<string> {
  const { data, error } = await serviceClient().auth.admin.createUser({
    email: `limpieza+${crypto.randomUUID()}@example.test`,
    password: crypto.randomUUID(),
    email_confirm: confirmed,
  })
  expect(error).toBeNull()

  const id = data.user!.id
  created.push(id)
  return id
}

async function exists(id: string): Promise<boolean> {
  const { data } = await serviceClient().auth.admin.getUserById(id)
  return data?.user != null
}

describeDb('a quién borra la limpieza de cuentas sin confirmar', () => {
  it('borra a quien nunca confirmó y ya pasó el plazo', async () => {
    const sinConfirmar = await person(false)

    await purgeUnconfirmedAccounts(inDays(UNCONFIRMED_ACCOUNT_TTL_DAYS + 1))

    expect(await exists(sinConfirmar)).toBe(false)
  })

  it('NO borra a quien confirmó, por viejo que sea', async () => {
    const confirmada = await person(true)

    await purgeUnconfirmedAccounts(inDays(400))

    expect(await exists(confirmada)).toBe(true)
  })

  it('NO borra a quien sigue sin confirmar pero está dentro del plazo', async () => {
    const reciente = await person(false)

    await purgeUnconfirmedAccounts(inDays(UNCONFIRMED_ACCOUNT_TTL_DAYS - 1))

    expect(await exists(reciente)).toBe(true)
  })

  it('con las dos a la vez, borra solo la que corresponde', async () => {
    const sinConfirmar = await person(false)
    const confirmada = await person(true)

    await purgeUnconfirmedAccounts(inDays(30))

    expect(await exists(sinConfirmar)).toBe(false)
    expect(await exists(confirmada)).toBe(true)
  })

  it('no toca las personas sembradas, que están confirmadas', async () => {
    await purgeUnconfirmedAccounts(inDays(400))

    const { data } = await serviceClient().auth.admin.listUsers({ page: 1, perPage: 200 })
    const emails = (data?.users ?? []).map((user) => user.email)
    expect(emails).toContain('ana@example.test')
    expect(emails).toContain('nueva@example.test')
  })
})
