import { Button } from '@/components/ui/button'

type Props = {
  texts: { restored: string; startOver: string }
  onStartOver: () => void
}

// Sin borde, sobre piedra, como la de publicar: es secundaria, y lo primero siguen siendo las
// preguntas.
export function RestoredDraftNote({ texts, onStartOver }: Props) {
  return (
    <div className="flex flex-col items-start gap-1 bg-surface p-4 text-sm text-ink">
      <p>{texts.restored}</p>
      <Button variant="ghost" size="sm" onClick={onStartOver}>
        {texts.startOver}
      </Button>
    </div>
  )
}
