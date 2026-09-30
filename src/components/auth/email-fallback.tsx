import { Disclosure } from '@/components/ui/disclosure'

type Props = {
  label: string
  isOpen: boolean
  children: React.ReactNode
}

// La puerta de atrás del ingreso, plegada debajo de Google.
export function EmailFallback({ label, isOpen, children }: Props) {
  return (
    <Disclosure label={label} open={isOpen}>
      <div className="mt-6">{children}</div>
    </Disclosure>
  )
}
