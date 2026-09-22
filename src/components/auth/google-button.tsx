import { startGoogleSignIn } from '@/actions/auth'
import { GoogleSubmit } from './google-submit'

type Props = {
  label: string
  next?: string
}

export function GoogleButton({ label, next }: Props) {
  return (
    <form action={startGoogleSignIn}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <GoogleSubmit label={label} />
    </form>
  )
}
