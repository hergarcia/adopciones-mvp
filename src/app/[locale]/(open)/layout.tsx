import { PaperFrame } from '@/app/[locale]/_components/paper-frame'

// Lo que se abre con o sin sesión y también con la cuenta suspendida, que es justo quien puede
// necesitar escribir (spec §Decisiones): fuera de los grupos con la puerta de la suspendida. Muestra
// el menú, así que va en la misma hoja que todo lo demás.
export default function OpenLayout({ children }: { children: React.ReactNode }) {
  return <PaperFrame>{children}</PaperFrame>
}
