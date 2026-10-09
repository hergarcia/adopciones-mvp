import { PaperFrame } from '@/app/[locale]/_components/paper-frame'

// Lo que se abre con o sin sesión y también con la cuenta suspendida, que es justo quien puede
// necesitar escribir (spec §Decisiones): fuera de los grupos con la puerta de la suspendida. Un
// volante, como el ingreso.
export default function OpenLayout({ children }: { children: React.ReactNode }) {
  return <PaperFrame size="handbill">{children}</PaperFrame>
}
