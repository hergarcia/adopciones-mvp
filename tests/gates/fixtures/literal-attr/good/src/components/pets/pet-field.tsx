type Props = { placeholder: string; label: string; status: string }

export function PetField({ placeholder, label, status }: Props) {
  return (
    <label>
      <input placeholder={placeholder} aria-label={label} />
      {status}
    </label>
  )
}
