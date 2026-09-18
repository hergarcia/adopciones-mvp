// Qué cuenta como error de la pantalla y qué es ruido del servidor de desarrollo.
//
// La lista permitida de pedidos fallidos de la aplicación está **vacía** en F00: todavía no hay
// ninguno que falle legítimamente. El 401 del ingreso que menciona el contrato de run-app llega
// con la historia de registro e ingreso.
export const ALLOWED_FAILED_REQUESTS = []

// El driver corre contra `pnpm dev`, porque la muestra no existe en el build de producción. El dev
// server habla por la consola y abre su propio websocket; sin ignorarlo, cada corrida daría
// código 1 por algo que no es un error de la pantalla.
const DEV_SERVER_NOISE = [
  /_next\/static\/(webpack|development)/,
  /\/_next\/(webpack-)?hmr/,
  /webpack\.hot-update/,
  /ws:\/\//,
  /WebSocket connection to/,
  /Download the React DevTools/,
  /\[Fast Refresh\]/,
  /React DevTools/,
]

export function isDevServerNoise(text) {
  return DEV_SERVER_NOISE.some((pattern) => pattern.test(text))
}

export function isAllowedFailedRequest(url) {
  return ALLOWED_FAILED_REQUESTS.some((pattern) => pattern.test(url))
}

/** Un problema real de la ruta, o null si es ruido que se ignora a propósito. */
export function classify({ kind, text }) {
  if (isDevServerNoise(text)) return null
  if (kind === 'request' && isAllowedFailedRequest(text)) return null
  return { kind, text }
}
