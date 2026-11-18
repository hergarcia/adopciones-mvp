import type { PetState } from '@/lib/pets/types'

// El sello cae solo como respuesta a lo que la persona acaba de tocar (historia #310, docs/10): la
// pantalla llegó por la navegación que siguió al toque, que el navegador pide como `fetch`
// (`Sec-Fetch-Dest: empty`). Abrir, recargar o entrar desde un enlace de afuera es un documento
// (`document`), y un navegador que no manda la cabecera muestra el sello quieto.
export function fallsOnArrival(fetchDest: string | null, justDone: boolean): boolean {
  return justDone && fetchDest === 'empty'
}

const DROPPED = new Map<string | null, PetState>([
  ['mark_in_process', 'in_process'],
  ['pause', 'paused'],
])

// El estado cuyo sello cae en la card de «Mis animales» después de una acción que salió bien: marcar
// en proceso y pausar. Las demás dejan el animal sin sello o lo llevan a otra pantalla.
export function stateDroppedBy(action: string | null): PetState | null {
  return DROPPED.get(action) ?? null
}
