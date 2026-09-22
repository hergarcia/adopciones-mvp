import { startGoogleSignIn } from '@/actions/auth'
import { GoogleSubmit } from './google-submit'

export function GoogleButton({ label }: { label: string }) {
  return (
    <form action={startGoogleSignIn}>
      <GoogleSubmit label={label} />
    </form>
  )
}
