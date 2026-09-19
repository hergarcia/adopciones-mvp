type Props = {
  id?: string
  /** Ya traducido. */
  children: React.ReactNode
}

export function ErrorText({ id, children }: Props) {
  return (
    <p
      id={id}
      className="animate-[fade-in_var(--dur-base)_var(--ease-out)] text-sm font-medium text-accent"
    >
      {children}
    </p>
  )
}
