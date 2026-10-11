// Las personas de prueba que crea el arnés de la base (`asNewUser` en tests/db/roles.ts). El arnés
// borra cada una al terminar su prueba; una corrida cortada a mitad las deja, y con ellas todo lo que
// crearon (FR-052). Borrar la cuenta se lleva lo suyo por cascada, como cuando la borra la persona.
import { createClient } from '@supabase/supabase-js'

const SYNTHETIC = /^prueba\+[^@]+@example\.test$/
const PAGE = 1000

function adminOf(env) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  }).auth.admin
}

async function listSynthetic(admin, page = 1) {
  const { data, error } = await admin.listUsers({ page, perPage: PAGE })
  if (error) throw new Error(`No se pudo listar a las personas: ${error.message}`)
  const found = data.users.filter((user) => SYNTHETIC.test(user.email ?? ''))
  if (data.users.length < PAGE) return found
  return [...found, ...(await listSynthetic(admin, page + 1))]
}

// Como en el arnés: borrar a dos personas que se solicitaron entre sí choca en la base y Auth
// contesta 500 sin decir que fue eso, así que se reintenta.
async function remove(admin, id, attempt = 1) {
  const { error } = await admin.deleteUser(id)
  if (!error || error.status === 404) return
  if ((error.status ?? 0) < 500 || attempt >= 5) {
    throw new Error(`No se pudo borrar a la persona de prueba ${id}: ${error.message}`)
  }
  await new Promise((resolve) => setTimeout(resolve, 200 * attempt))
  await remove(admin, id, attempt + 1)
}

/** Borra las que haya, de a una, y cuenta las que quedaron: tiene que dar cero. */
export async function sweepSyntheticPeople(env) {
  const admin = adminOf(env)
  const people = await listSynthetic(admin)
  for (const person of people) {
    // oxlint-disable-next-line no-await-in-loop -- de a una: en paralelo chocan, ver `remove`
    await remove(admin, person.id)
  }
  const left = await listSynthetic(admin)
  return { removed: people.length, left: left.length }
}
