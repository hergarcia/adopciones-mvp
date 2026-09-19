// La prueba de ejemplo del arnés. Confirma que cada rol es quien dice ser contra la base real, que
// es lo que hace utilizable el arnés desde M1: sin esto, una prueba de RLS podría estar corriendo
// como servicio y "pasar" sin haber probado nada.
//
// Salda además la fila «Privacidad de contacto e identidad» de docs/09 §Compuertas en esta
// historia, porque todavía no hay reglas de RLS propias que probar.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { anonClient, asNewUser, serviceClient, whoami, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []

afterEach(async () => {
  // Corre también cuando la prueba falló a mitad: si no, quedaría una persona sembrada y el check
  // de "ninguna persona sembrada" se pondría rojo por culpa del arnés. Cada cleanup borra su propia
  // persona, así que no dependen entre sí y van juntos.
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('el arnés distingue los tres roles', () => {
  it('sin sesión, la base no ve ninguna identidad', async () => {
    expect(await whoami(anonClient())).toBeNull()
  })

  it('con la persona sintética, la base ve su propia identidad', async () => {
    const user = await asNewUser()
    cleanups.push(user.cleanup)

    expect(await whoami(user.client)).toBe(user.id)
  })

  it('con permisos de servicio, la identidad no es la de ninguna persona', async () => {
    const user = await asNewUser()
    cleanups.push(user.cleanup)

    const asService = await whoami(serviceClient())
    expect(asService).not.toBe(user.id)
    expect(asService).toBeNull()
  })

  it('la persona sintética se borra al terminar', async () => {
    const user = await asNewUser()
    await user.cleanup()

    const service = serviceClient()
    const { data } = await service.auth.admin.getUserById(user.id)
    expect(data.user).toBeNull()
  })
})
