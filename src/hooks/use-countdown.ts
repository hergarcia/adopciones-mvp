'use client'

import { useEffect, useState } from 'react'

// Cuenta desde que llegó la página y no desde el reloj del teléfono, que puede estar corrido.
export function useCountdown(initialSeconds: number): [number, (seconds: number) => void] {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (seconds <= 0) return undefined
    const timer = setTimeout(() => setSeconds((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  return [seconds, setSeconds]
}
