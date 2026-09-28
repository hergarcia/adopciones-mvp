import { useState } from 'react'
import { listingRequester } from '@/lib/pets/listing-requests'

// Los pedidos de tandas del listado, uno a la vez: la regla (abortar el anterior, decir por qué
// falló) vive en `listingRequester`, con su test; esto solo la guarda entre renders.
export function useListingPages() {
  const [request] = useState(() => listingRequester((input, init) => fetch(input, init)))
  return request
}
