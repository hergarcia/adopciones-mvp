type Props = { pet: { name: string } }

export function PetCard({ pet }: Props) {
  return <div>{pet.name}</div>
}
