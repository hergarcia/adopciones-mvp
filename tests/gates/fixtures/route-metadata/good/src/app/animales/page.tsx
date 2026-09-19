import type { Metadata } from 'next'
import { APP_NAME } from '@/lib/config'

export const metadata: Metadata = {
  title: { absolute: APP_NAME },
}

export default function Animales() {
  return <main />
}
