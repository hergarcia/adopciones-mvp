/**
 * El nombre que une la foto de una tarjeta con la portada de su ficha: con el mismo nombre en las
 * dos pantallas, el navegador lleva una a la otra al abrir la ficha y al volver (historia #307). Los
 * animales y las camadas sacan el código de la misma lista, así que alcanza con él.
 */
export function coverTransitionName(code: string): string {
  return `cover-${code}`
}
