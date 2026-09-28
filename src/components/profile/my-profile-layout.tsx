type Props = {
  /** Foto, nombre, zona y la chapita. */
  summary: React.ReactNode
  /** «Tu perfil público». */
  publicProfile: React.ReactNode
  /** «Tu correo». */
  email: React.ReactNode
  /** «Tu teléfono». */
  phone: React.ReactNode
  /** «Tu identidad». */
  identity: React.ReactNode
  /** «Editar mi perfil» y las salidas. */
  footer: React.ReactNode
}

// «Mi perfil» en dos partes: lo que ven los demás —quién sos y tu perfil público, con el enlace que
// se pega en el grupo a la vista, sin bajar— y el estado de la cuenta: correo, teléfono, identidad.
// En el teléfono una debajo de la otra, en la medida de lectura; desde 1024, lado a lado dentro de
// la hoja, con «Editar mi perfil» y las salidas debajo de la primera (docs/10, MyProfileLayout). Lo
// usan la página y su skeleton.
export function MyProfileLayout({ summary, publicProfile, email, phone, identity, footer }: Props) {
  return (
    <div className="flex max-w-[var(--measure)] flex-col lg:grid lg:max-w-none lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-12">
      <div className="flex min-w-0 flex-col gap-8">
        {summary}
        {publicProfile}
      </div>
      <div className="mt-8 flex min-w-0 flex-col gap-6 lg:row-span-2 lg:mt-0">
        {email}
        {phone}
        {identity}
      </div>
      <div className="mt-8 min-w-0">{footer}</div>
    </div>
  )
}
