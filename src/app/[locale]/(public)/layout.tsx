import { ErrorTextsProvider } from '@/app/[locale]/_components/error-texts-provider'
import { PaperFrame } from '@/app/[locale]/_components/paper-frame'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <PaperFrame size="wall">
      <ErrorTextsProvider>{children}</ErrorTextsProvider>
    </PaperFrame>
  )
}
