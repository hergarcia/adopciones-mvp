import { createServiceSupabase } from '@/lib/supabase/service'
import { isPurgeable } from './stale-accounts'

const PAGE_SIZE = 200
const MAX_PAGES = 25

// Borra las personas que nunca abrieron su enlace y ya pasaron el plazo. Existe porque
// `generateLink` crea la persona aunque nadie abra el correo: sin esto, escribir una dirección
// cualquiera dejaría un registro permanente, que contradice FR-030a y el principio V.
//
// Pagina hasta agotar y no mira solo la primera página: el listado viene de la más nueva a la más
// vieja, así que quedarse con las primeras doscientas dejaría a las candidatas —que por
// definición son las más viejas— fuera de alcance para siempre.
export async function purgeUnconfirmedAccounts(now: Date): Promise<number> {
  const service = createServiceSupabase()
  const purgeable: string[] = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    // Paginar es secuencial por definición: no se sabe si hay página siguiente sin haber traído
    // la actual. El borrado, que sí es paralelizable, va junto al final.
    // eslint-disable-next-line no-await-in-loop
    const { data } = await service.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    const users = data?.users ?? []

    for (const user of users) {
      const candidate = {
        createdAt: new Date(user.created_at),
        confirmedAt: user.email_confirmed_at ? new Date(user.email_confirmed_at) : null,
      }
      if (isPurgeable(candidate, now)) purgeable.push(user.id)
    }

    if (users.length < PAGE_SIZE) break
  }

  await Promise.all(purgeable.map((id) => service.auth.admin.deleteUser(id)))
  return purgeable.length
}
