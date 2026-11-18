import { headers } from 'next/headers'
import { fallsOnArrival } from './drop'

/** Si el sello de la pantalla cae: `justDone` y la pantalla llegó por el toque, no por abrirla. */
export async function stampFalls(justDone: boolean): Promise<boolean> {
  return fallsOnArrival((await headers()).get('sec-fetch-dest'), justDone)
}
