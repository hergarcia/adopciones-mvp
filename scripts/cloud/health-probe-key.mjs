// Se carga con `--import` solo en las pruebas que corre privacy-check.mjs. El arnés decide si hay base
// pidiendo `/auth/v1/health` sin clave (tests/setup/database.ts): la base local contesta, pero la
// pasarela de la nube pide la clave en toda ruta, y sin ella cada prueba se omitiría como si no
// hubiera base. Solo a ese pedido le suma la clave publicable, que es pública.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const probe = `${url}/auth/v1/health`
const fetchAsIs = globalThis.fetch

globalThis.fetch = (input, init) => {
  if (!key || input !== probe) return fetchAsIs(input, init)
  const headers = new Headers(init?.headers)
  headers.set('apikey', key)
  return fetchAsIs(input, { ...init, headers })
}
