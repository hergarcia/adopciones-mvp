// El teléfono verifica a la persona (#10) pero no es una llave para entrar: con el proveedor de
// teléfono prendido, quien tuviera un número podría ingresar a una cuenta ajena o crear una nueva
// salteándose el correo. Corre en local y, con scripts/cloud/privacy-check.mjs, contra la nube.
import { expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { anonClient, serviceClient } from './roles'

const PHONE = '+59899123456'
const digits = (value: string | undefined) => (value ?? '').replaceAll(/\D/gu, '')

// Covers: FR-014, KL-017
describeDb('el ingreso con teléfono', () => {
  it('NO deja pedir un código de ingreso con un teléfono, y no crea a nadie', async () => {
    const { error } = await anonClient().auth.signInWithOtp({ phone: PHONE })
    // El proveedor apagado, no un envío que falló: con el proveedor prendido y Twilio caído, el
    // mismo pedido también daría error, y mañana podría andar.
    expect(error?.code).toBe('phone_provider_disabled')

    // El listado viene de la más nueva a la más vieja: una persona creada recién estaría primera.
    const { data, error: listError } = await serviceClient().auth.admin.listUsers({ perPage: 1000 })
    expect(listError).toBeNull()
    expect(data.users.filter((user) => digits(user.phone) === digits(PHONE))).toEqual([])
  })
})
