import { createServiceSupabase } from '@/lib/supabase/service'
import { isPurgeable } from './stale-accounts'

// Borra las personas que nunca abrieron su enlace y ya pasaron el plazo. Existe porque
// `generateLink` crea la persona aunque nadie abra el correo: sin esto, escribir una dirección
// cualquiera dejaría un registro permanente, que contradice FR-030a y el principio V.
//
// La página de listado alcanza de sobra: en este producto nadie pide miles de enlaces por hora, y
// si alguna vez pasa, la limpieza del pedido siguiente sigue donde quedó.
export async function purgeUnconfirmedAccounts(now: Date): Promise<number> {
  const service = createServiceSupabase()
  const { data } = await service.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (!data) return 0

  const purgeable = data.users.filter((user) =>
    isPurgeable(
      {
        createdAt: new Date(user.created_at),
        confirmedAt: user.email_confirmed_at ? new Date(user.email_confirmed_at) : null,
      },
      now,
    ),
  )

  await Promise.all(purgeable.map((user) => service.auth.admin.deleteUser(user.id)))
  return purgeable.length
}
