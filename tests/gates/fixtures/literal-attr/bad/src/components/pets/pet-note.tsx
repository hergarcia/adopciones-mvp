type NoteProps = {
  title: string
  description: string
  message: string
  error: string
  closeLabel: string
}

function Note({ title }: NoteProps) {
  return <p>{title}</p>
}

export function PetNote() {
  return (
    <>
      {'Texto en un fragmento'}
      <Note
        title="Eliminar"
        description="No se puede deshacer"
        message="Publicado"
        error="Campo requerido"
        closeLabel="Cerrar"
      />
    </>
  )
}
