import { ErrorTextsProvider } from '@/app/[locale]/_components/error-texts-provider'
import { PaperFrame } from '@/app/[locale]/_components/paper-frame'

// La pantalla de una cuenta suspendida, en su propio grupo: un volante sin el menú del sitio, porque
// para ella no hay otro lugar a dónde ir (spec §Pantallas, research R4).
export default function SuspendedLayout({ children }: { children: React.ReactNode }) {
  return (
    <PaperFrame size="handbill" menu={false}>
      <ErrorTextsProvider>{children}</ErrorTextsProvider>
    </PaperFrame>
  )
}
