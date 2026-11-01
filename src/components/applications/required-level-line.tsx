import { VerificationBadge } from '@/components/verification/verification-badge'

// En la ficha, antes de tocar nada (US3-AS1): el animal pide identidad verificada. La chapita del
// nivel en chico, que es confianza, y el texto, que es lo que se lee. En «Cómo le va a…» dice también
// el nivel 1 (historia #269).
export function RequiredLevelLine({ text, level = 2 }: { text: string; level?: 1 | 2 }) {
  return (
    <p className="flex basis-full items-center gap-2 text-sm text-ink">
      <span aria-hidden="true">
        <VerificationBadge level={level} size="sm" href={null} label="" />
      </span>
      {text}
    </p>
  )
}
