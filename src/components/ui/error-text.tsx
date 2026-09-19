type Props = {
  id?: string
  /** Ya traducido. */
  children: React.ReactNode
  /**
   * Para el error que aparece solo, sin que la persona haya tocado ese campo: el de una foto que
   * terminó de procesarse mal, el de un guardado que no salió. El de un campo no lo lleva: al
   * enviar saldrían todos a la vez, y ese ya se alcanza recorriendo el formulario.
   */
  announce?: boolean
}

export function ErrorText({ id, children, announce = false }: Props) {
  return (
    <p
      id={id}
      {...(announce ? { role: 'alert' } : {})}
      className="animate-[fade-in_var(--dur-base)_var(--ease-out)] text-sm font-medium text-accent"
    >
      {children}
    </p>
  )
}
