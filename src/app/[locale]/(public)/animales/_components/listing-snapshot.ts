import { isApiPage } from '@/lib/pets/listing-requests'
import type { ListingSnapshot } from '@/lib/pets/listing-state'

const KEY = 'listado'

// Una comodidad de la pestaña: muere con ella, no viaja y no se mide (FR-023). El almacenamiento
// puede no existir o no dejar escribir (una ventana privada): entonces no hay nada que reponer.
export function readSnapshot(): ListingSnapshot | null {
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(KEY) ?? 'null')
    return isSnapshot(value) ? value : null
  } catch {
    return null
  }
}

export function writeSnapshot(snapshot: ListingSnapshot | null): void {
  try {
    if (snapshot === null) window.sessionStorage.removeItem(KEY)
    else window.sessionStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch {
    // Sin dónde guardarla, volver atrás muestra lo que trae el servidor: el mínimo de FR-016.
  }
}

function isSnapshot(value: unknown): value is ListingSnapshot {
  if (!isApiPage(value)) return false
  const field = (key: string) => typeof Reflect.get(value, key)
  return (
    field('href') === 'string' &&
    field('returning') === 'boolean' &&
    field('scrollY') === 'number' &&
    field('total') === 'number' &&
    field('totalText') === 'string'
  )
}
