import { ErrorTextsProvider } from '@/app/[locale]/_components/error-texts-provider'
import { PaperFrame } from '@/app/[locale]/_components/paper-frame'

// La pantalla de una cuenta suspendida, en su propio grupo: sin el menú del sitio, porque para ella
// no hay otro lugar a dónde ir (spec §Pantallas, research R4), y por eso en la hoja angosta del flujo
// de foco; el pie, por lo mismo, solo con Ayuda (historia #200, FR-014).
export default function SuspendedLayout({ children }: { children: React.ReactNode }) {
  return (
    <PaperFrame menu={false} footer="help">
      <ErrorTextsProvider>{children}</ErrorTextsProvider>
    </PaperFrame>
  )
}
