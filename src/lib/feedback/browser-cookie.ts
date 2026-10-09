export const FEEDBACK_BROWSER_COOKIE = 'opinar'

const ONE_YEAR = 60 * 60 * 24 * 365

// La cookie la escribe el navegador al enviar y no la acción: una Server Action que escribe
// una cookie hace que Next vuelva a pintar la pantalla, y eso medía dos veces la visita a la ficha o
// al listado (research R8, Cambios de Build).
export function ensureFeedbackBrowser(): void {
  const present = document.cookie
    .split('; ')
    .some((pair) => pair.startsWith(`${FEEDBACK_BROWSER_COOKIE}=`))
  if (present) return
  // oxlint-disable-next-line unicorn/no-document-cookie -- una sola cookie, sin la Cookie Store API en Safari
  document.cookie = `${FEEDBACK_BROWSER_COOKIE}=${crypto.randomUUID()}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}
