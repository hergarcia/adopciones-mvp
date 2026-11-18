// Para la parte viva de un botón que se muestra recién cuando llegó (como «Compartir»): espera
// también las capas que abre, que bajan aparte (historia #304). Sin esto, el botón aparecía antes
// que su capa y, si la señal se cortaba en ese hueco, el toque no hacía nada.
export function withLayers<T>(
  load: Promise<T>,
  layers: { overlay?: boolean; toast?: boolean },
): Promise<T> {
  return Promise.all([
    load,
    layers.overlay === true ? import('./overlay-layer') : null,
    layers.toast === true ? import('./toast-layer') : null,
  ]).then(([module]) => module)
}
