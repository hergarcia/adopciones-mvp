/**
 * Si el pedido es el de un toque dentro del sitio (el router de Next pide la pantalla con `fetch`) y
 * no el de abrir una dirección: un enlace pegado en un grupo, la vista previa de WhatsApp, un
 * buscador o el navegador que no ejecuta nada. Solo ese pedido puede llegar en dos envíos, primero
 * la espera y después la pantalla; el otro trae la pantalla entera en el HTML (historia #302).
 */
export function isInSiteNavigation(request: Pick<Headers, 'get'>): boolean {
  // Sin el encabezado (un lector de vistas previas, un navegador viejo) se toma como abrir la
  // dirección: lo que se pierde es la espera, nunca la pantalla entera.
  return request.get('sec-fetch-dest') === 'empty'
}
