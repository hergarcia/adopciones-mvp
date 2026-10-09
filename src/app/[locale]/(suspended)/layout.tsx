import { ErrorTextsProvider } from '@/app/[locale]/_components/error-texts-provider'
import { PaperFrame } from '@/app/[locale]/_components/paper-frame'

// La pantalla de una cuenta suspendida, en su propio grupo: un volante sin el menú del sitio, porque
// para ella no hay otro lugar a dónde ir (spec §Pantallas, research R4); tampoco las preguntas,
// que la devolverían acá (historia #8, SC-007).
export default function SuspendedLayout({ children }: { children: React.ReactNode }) {
  return (
    <PaperFrame size="handbill" menu={false} questions={false}>
      <ErrorTextsProvider>{children}</ErrorTextsProvider>
    </PaperFrame>
  )
}
