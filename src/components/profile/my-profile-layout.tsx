type Props = {
  /** Foto, nombre, zona y el correo. */
  summary: React.ReactNode
  /** «Tu teléfono». */
  phone: React.ReactNode
  /** «Tu identidad». */
  identity: React.ReactNode
  /** «Tu perfil público». */
  publicProfile: React.ReactNode
  /** «Editar mi perfil» y las salidas. */
  footer: React.ReactNode
}

// «Mi perfil» en la medida de lectura y, desde 1024, en dos columnas dentro de la hoja: quién sos y
// tu teléfono; tu identidad y tu perfil público. En una sola columna de 640 quedaba un tercio de la
// hoja vacío a lo largo de toda la página (docs/10 §Pantallas anchas). Lo usan la página y su
// skeleton.
export function MyProfileLayout({ summary, phone, identity, publicProfile, footer }: Props) {
  return (
    <div className="flex max-w-[var(--measure)] flex-col lg:grid lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-x-12">
      <div className="min-w-0">
        {summary}
        <div className="mt-6">{phone}</div>
      </div>
      <div className="mt-6 min-w-0 lg:mt-0">
        {identity}
        <div className="mt-8">{publicProfile}</div>
      </div>
      <div className="mt-8 min-w-0">{footer}</div>
    </div>
  )
}
