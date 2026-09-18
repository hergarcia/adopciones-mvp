import type { Metadata } from 'next'
import { APP_NAME, APP_URL } from '@/lib/config'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: APP_NAME,
  metadataBase: new URL(APP_URL),
}

type Props = {
  children: React.ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
