import { ErrorTextsProvider } from '@/app/[locale]/_components/error-texts-provider'

// Los límites de error del listado y de la ficha necesitan sus textos en el cliente. Acá y no en el
// layout de `(public)`: la portada no tiene límite de error propio, y el proveedor le sumaría JS
// que el presupuesto no tiene (docs/07 §Presupuesto).
export default function AnimalsLayout({ children }: { children: React.ReactNode }) {
  return <ErrorTextsProvider>{children}</ErrorTextsProvider>
}
