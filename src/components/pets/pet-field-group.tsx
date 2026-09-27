type Props = { legend: string; children: React.ReactNode }

// Uno de los cuatro grupos del formulario de un animal: su título y sus campos.
export function PetFieldGroup({ legend, children }: Props) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-6">
      <legend className="mb-4 text-lg font-bold text-ink">{legend}</legend>
      {children}
    </fieldset>
  )
}
