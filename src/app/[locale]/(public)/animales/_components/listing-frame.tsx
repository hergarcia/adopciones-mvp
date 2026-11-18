import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  title: string
  children: React.ReactNode
}

// «Animales en adopción» y debajo el listado o su espera, en el mismo lugar: al llegar, el título no
// se mueve (historia #302).
export function ListingFrame({ title, children }: Props) {
  return (
    <PageShell width="full">
      <h1 className="afiche text-2xl text-ink">{title}</h1>
      <div className="mt-2">{children}</div>
    </PageShell>
  )
}
