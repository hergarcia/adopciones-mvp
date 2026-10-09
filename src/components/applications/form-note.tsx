// Un aviso quieto dentro del formulario, sobre piedra y sin borde: dice algo que conviene saber y no
// pide nada (plan §Diseño). Lo usan el de en proceso y el del contacto.
export function FormNote({ children }: { children: React.ReactNode }) {
  return <p className="bg-surface p-4 text-sm text-ink">{children}</p>
}
