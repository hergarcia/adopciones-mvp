// Arnés de pruebas de privacidad. Tres roles, porque toda regla de visibilidad del MVP se prueba
// en la base (constitución §V) y lo que hay que poder demostrar es lo que un rol **no** ve:
//
//   anonClient()    visitante sin sesión
//   asNewUser()     una persona sintética, con un JWT real, y su cleanup
//   serviceClient() permisos de servicio, que saltean RLS
//
// El JWT tiene que ser real: el patrón que va a usar M1 es
// `to authenticated using ((select auth.uid()) = user_id)`, y un contexto falseado no lo probaría.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requireEnv } from '../../src/lib/env'

type Client = SupabaseClient

export function anonClient(): Client {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false } },
  )
}

export function serviceClient(): Client {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
}

export type SyntheticUser = {
  id: string
  email: string
  client: Client
  /** Borra la persona. Se llama en afterEach, así corre también si la prueba falla a mitad. */
  cleanup: () => Promise<void>
}

// Una persona por prueba, con correo único, creada con permisos de servicio y después ingresada de
// verdad para que la base la vea como `authenticated`.
export async function asNewUser(): Promise<SyntheticUser> {
  const service = serviceClient()
  const email = `prueba+${crypto.randomUUID()}@example.test`
  const password = crypto.randomUUID()

  const created = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (created.error || !created.data.user) {
    throw new Error(`no se pudo crear la persona sintética: ${created.error?.message}`)
  }
  const id = created.data.user.id

  const client = anonClient()
  const signedIn = await client.auth.signInWithPassword({ email, password })
  if (signedIn.error) {
    await service.auth.admin.deleteUser(id)
    throw new Error(`no se pudo ingresar como la persona sintética: ${signedIn.error.message}`)
  }

  return {
    id,
    email,
    client,
    cleanup: async () => {
      await client.auth.signOut()
      await service.auth.admin.deleteUser(id)
    },
  }
}

/** Le pregunta a la base quién es la sesión de este cliente. Null sin sesión. */
export async function whoami(client: Client): Promise<string | null> {
  const { data, error } = await client.rpc('whoami')
  if (error) {
    throw new Error(`whoami() falló: ${error.message}`)
  }
  return typeof data === 'string' ? data : null
}
