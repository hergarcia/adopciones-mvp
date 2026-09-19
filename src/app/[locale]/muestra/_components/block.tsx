type Props = {
  title: string
  children: React.ReactNode
}

export function Block({ title, children }: Props) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <h2 className="afiche text-xl text-ink">{title}</h2>
      {children}
    </section>
  )
}
