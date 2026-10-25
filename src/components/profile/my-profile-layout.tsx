type Props = {
  /** Foto, nombre, zona y la chapita. */
  summary: React.ReactNode
  /** «Editar mi perfil», la única tirita de la pantalla. */
  primaryAction: React.ReactNode
  /** «Tu perfil público». */
  publicProfile: React.ReactNode
  /** Los accesos a las listas de la persona: avales, bloqueos y solicitudes. */
  lists: React.ReactNode
  /** «Tu correo». */
  email: React.ReactNode
  /** «Tu teléfono». */
  phone: React.ReactNode
  /** «Tu identidad». */
  identity: React.ReactNode
  /** Las salidas de la cuenta. */
  footer: React.ReactNode
}

// «Mi perfil» en dos partes: lo que ven los demás —quién sos, «Editar mi perfil» pegado debajo, tu
// perfil público y tus listas— y el estado de la cuenta: correo, teléfono, identidad. En el teléfono
// una debajo de la otra, en la medida de lectura; desde 1024, lado a lado dentro de la hoja. Las
// salidas van al pie de todo, debajo de las dos, lejos de la tirita (docs/10, MyProfileLayout). Lo
// usan la página y su skeleton.
export function MyProfileLayout({
  summary,
  primaryAction,
  publicProfile,
  lists,
  email,
  phone,
  identity,
  footer,
}: Props) {
  return (
    <div className="flex max-w-[var(--measure)] flex-col lg:grid lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-x-12">
      <div className="flex min-w-0 flex-col gap-10">
        <div className="flex flex-col gap-6">
          {summary}
          {primaryAction}
        </div>
        {publicProfile}
        {lists}
      </div>
      <div className="mt-10 flex min-w-0 flex-col gap-6 lg:mt-0">
        {email}
        {phone}
        {identity}
      </div>
      <div className="mt-8 min-w-0 lg:col-span-2">{footer}</div>
    </div>
  )
}
