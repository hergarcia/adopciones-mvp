type Props = { urgent: boolean }

export function PetField({ urgent }: Props) {
  return (
    <label>
      <input placeholder="Tu nombre" aria-label={urgent ? 'Urgente' : 'Sin apuro'} />
      {urgent ? 'Urgente' : 'Sin apuro'}
    </label>
  )
}
