// «Se entregan desde el 3 de noviembre»: no impide pedir (FR-030), así que se lee como un dato más y
// no como un aviso.
export function DeliveryDateLine({ text }: { text: string }) {
  return <p className="text-base font-bold text-ink">{text}</p>
}
