import { VerificationBadge } from '@/components/verification/verification-badge'

// En la ficha, antes de tocar nada (US3-AS1): el animal pide identidad verificada. La chapita del
// nivel 2 en chico, que es confianza, y el texto, que es lo que se lee.
export function RequiredLevelLine({ text }: { text: string }) {
  return (
    <p className="flex basis-full items-center gap-2 text-sm text-ink">
      <span aria-hidden="true">
        <VerificationBadge level={2} size="sm" href={null} label="" />
      </span>
      {text}
    </p>
  )
}
