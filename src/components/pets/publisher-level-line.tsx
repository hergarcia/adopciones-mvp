// El nivel de quien publicó en la tarjeta (historia #273): texto en el verde de lo verificado, sin
// chapita ni fondo, porque el único acento de la pared es «Urgente». Va en el ancho condensado del
// sello de la ficha, que dice las mismas palabras: en ancho normal «Identidad verificada y avalada»
// no entra en un renglón de la pared de dos columnas a 390 px.
export function PublisherLevelLine({ label }: { label: string }) {
  return (
    <p className="text-sm font-medium font-stretch-(--stretch-afiche) whitespace-nowrap text-primary">
      {label}
    </p>
  )
}
