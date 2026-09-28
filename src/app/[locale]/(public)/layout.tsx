import { PaperFrame } from '@/app/[locale]/_components/paper-frame'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PaperFrame size="wall">{children}</PaperFrame>
}
