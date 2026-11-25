// La redirección de una ruta lleva la dirección relativa: detrás de Funnel, el origen que ve el
// servidor es el de adentro del contenedor (`0.0.0.0:3000`), y el navegador resuelve una relativa
// contra la página que ya tiene abierta (docs/07, decisión 2026-11-24). Una absoluta (`wa.me`) pasa
// tal cual.
export function redirectTo(location: string, status: 303 | 307 = 307): Response {
  return new Response(null, { status, headers: { Location: location } })
}
