// «Rescatista» como etiqueta informativa y no como sello: el sello marca un estado y ser rescatista
// es un atributo que no cambia solo. Tampoco va en yerba: el verde y la prominencia son de la
// chapita, que tiene que seguir siendo lo único que resalte (docs/10 §Principios 2, §Recursos).
export function RescuerTag({ label }: { label: string }) {
  return <span className="border-2 border-ink px-2 py-1 text-sm text-ink">{label}</span>
}
