// El volver del navegador con cambios sin guardar (research R17 de la historia #53). Mientras hay
// cambios, arriba del historial queda una entrada centinela, marcada en su `state`: volver saca esa
// entrada y no la página, así que el formulario puede preguntar antes de perder lo cargado.
//
// La marca se suma al `state` que ya había, sin reemplazarlo: el router de Next guarda ahí su árbol
// y, sin él, un `popstate` recarga la página entera.
const MARK = 'unsavedGuard'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isSentinel(state: unknown): boolean {
  return isRecord(state) && state[MARK] === true
}

/** El `state` de la centinela: el de la entrada actual, con la marca. */
export function sentinelState(current: unknown): Record<string, unknown> {
  return { ...(isRecord(current) ? current : {}), [MARK]: true }
}

/** Con cambios: empujar la centinela, salvo que ya esté arriba. */
export function shouldPushSentinel(current: unknown): boolean {
  return !isSentinel(current)
}

// Un `popstate` que deja la centinela atrás es la persona volviendo: se vuelve a empujar y se
// pregunta. Cualquier otro —avanzar, o volver con el guardia soltado— no es asunto del guardia.
export function popAction(state: unknown, guarding: boolean): 'ask' | 'ignore' {
  return guarding && !isSentinel(state) ? 'ask' : 'ignore'
}

// Sin cambios (publicó, guardó, empezó de cero), la centinela se retira solo si sigue arriba: si ya
// se navegó a otra entrada, volver se llevaría a la persona de donde está.
export function cleanAction(current: unknown): 'retreat' | 'stay' {
  return isSentinel(current) ? 'retreat' : 'stay'
}
